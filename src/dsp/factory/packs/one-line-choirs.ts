import { type FactoryPreset, type Phrase } from '../types'

// One finger and six voices. Every phrase is a line (or one key) and the note a maker turns it
// round. A note four steps from the centre makes a ninth chord, five a triad, six a stack of
// fourths, eight a stack of fifths. The open fan, the filled fan, over one held note, in canon,
// rolled, and a centre that walks.

// Round D4. The line opens from a second to a ninth and closes again on the centre.
const FAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 64, gain: 0.6 },
    { atSec: 0.75, durSec: 0.75, note: 67, gain: 0.6 },
    { atSec: 1.5, durSec: 1.05, note: 72, gain: 0.65 },
    { atSec: 2.6, durSec: 1.4, note: 76, gain: 0.6 },
    { atSec: 4.05, durSec: 0.65, note: 72, gain: 0.5 },
    { atSec: 4.7, durSec: 0.7, note: 69, gain: 0.5 },
    { atSec: 5.4, durSec: 1.3, note: 62, gain: 0.5 },
  ],
}
// Round D4, for slow sounds: four steps out is a ninth chord on G, six a stack of fourths, eight a stack of fifths.
const SLOW_FAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.95, note: 69, gain: 0.6 },
    { atSec: 2, durSec: 1.95, note: 72, gain: 0.6 },
    { atSec: 4, durSec: 2.3, note: 76, gain: 0.6 },
  ],
}
// Round D4: three, six, seven and eight steps out, one key at a time, for voices that come one after another.
const OPENING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 67, gain: 0.6 },
    { atSec: 1.6, durSec: 1.3, note: 72, gain: 0.6 },
    { atSec: 3.2, durSec: 1.3, note: 74, gain: 0.55 },
    { atSec: 4.8, durSec: 1.7, note: 76, gain: 0.55 },
  ],
}
// Round D4 from below: the line sinks to D3 while its mirror climbs to D5.
const VALLEY: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 60, gain: 0.55 },
    { atSec: 1, durSec: 0.95, note: 57, gain: 0.6 },
    { atSec: 2, durSec: 1.4, note: 55, gain: 0.6 },
    { atSec: 3.5, durSec: 1.4, note: 52, gain: 0.6 },
    { atSec: 5, durSec: 1.6, note: 50, gain: 0.55 },
  ],
}
// Round A3: E4 is a D minor ninth, G4 fourths from B2, B4 fifths from G2.
const HALFWAY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 64, gain: 0.6 },
    { atSec: 1.5, durSec: 0.75, note: 62, gain: 0.5 },
    { atSec: 2.3, durSec: 1.4, note: 67, gain: 0.6 },
    { atSec: 3.8, durSec: 1.1, note: 69, gain: 0.55 },
    { atSec: 5, durSec: 1.5, note: 71, gain: 0.55 },
  ],
}
// Round G4: C major ninth, D minor seventh, E minor, then fourths and fifths.
const ROUND_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 74, gain: 0.6 },
    { atSec: 1, durSec: 0.95, note: 72, gain: 0.5 },
    { atSec: 2, durSec: 1.4, note: 76, gain: 0.6 },
    { atSec: 3.5, durSec: 0.95, note: 77, gain: 0.55 },
    { atSec: 4.5, durSec: 1.6, note: 81, gain: 0.5 },
  ],
}
// Under D5: the line steps down from the centre and what is made of it climbs.
const UNDER_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 1.3, durSec: 1.2, note: 67, gain: 0.6 },
    { atSec: 2.6, durSec: 1.5, note: 64, gain: 0.6 },
    { atSec: 4.3, durSec: 1.7, note: 60, gain: 0.55 },
  ],
}
// A dorian line over a held D.
const OVER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 69, gain: 0.6 },
    { atSec: 1, durSec: 0.5, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 0.9, note: 65, gain: 0.55 },
    { atSec: 2.5, durSec: 1.2, note: 64, gain: 0.55 },
    { atSec: 4, durSec: 0.6, note: 72, gain: 0.6 },
    { atSec: 4.6, durSec: 0.6, note: 71, gain: 0.5 },
    { atSec: 5.2, durSec: 1.4, note: 69, gain: 0.5 },
  ],
}
// Three notes four times over, so that only the centre changes the harmony.
const TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.45, note: 76, gain: 0.6 },
    { atSec: 0.5, durSec: 0.45, note: 74, gain: 0.5 },
    { atSec: 1, durSec: 0.5, note: 69, gain: 0.55 },
    { atSec: 1.6, durSec: 0.45, note: 76, gain: 0.6 },
    { atSec: 2.1, durSec: 0.45, note: 74, gain: 0.5 },
    { atSec: 2.6, durSec: 0.5, note: 69, gain: 0.55 },
    { atSec: 3.2, durSec: 0.45, note: 76, gain: 0.6 },
    { atSec: 3.7, durSec: 0.45, note: 74, gain: 0.5 },
    { atSec: 4.2, durSec: 0.5, note: 69, gain: 0.55 },
    { atSec: 4.8, durSec: 0.45, note: 76, gain: 0.6 },
    { atSec: 5.3, durSec: 0.45, note: 74, gain: 0.5 },
    { atSec: 5.8, durSec: 0.5, note: 69, gain: 0.55 },
  ],
}
// One key.
const HELD: Phrase = {
  notes: [{ atSec: 0, durSec: 6.4, note: 74, gain: 0.6 }],
}
// Two keys, a fifth.
const HELD_FIFTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 69, gain: 0.55 },
    { atSec: 0, durSec: 6.4, note: 76, gain: 0.5 },
  ],
}
// Four notes a second and a half apart, with room for the others to come in.
const CANON_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 1.5, durSec: 1.2, note: 74, gain: 0.6 },
    { atSec: 3, durSec: 1.2, note: 72, gain: 0.55 },
    { atSec: 4.5, durSec: 1.2, note: 67, gain: 0.55 },
  ],
}
// Two notes, then the whole answer.
const CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 1.3, durSec: 1.5, note: 76, gain: 0.6 },
  ],
}
// Two notes lower, round A3: a minor ninth on D, then fourths from B2.
const CALL_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 64, gain: 0.6 },
    { atSec: 1.3, durSec: 1.5, note: 67, gain: 0.6 },
  ],
}
// Thirds round D4: their mirrors are thirds in contrary motion, A minor seventh twice, a bare C, F with its ninth and raised fourth, G ninth, A minor seventh.
const TWO_FINGERS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.1, note: 67, gain: 0.5 },
    { atSec: 1.1, durSec: 1.1, note: 69, gain: 0.5 },
    { atSec: 1.1, durSec: 1.1, note: 72, gain: 0.5 },
    { atSec: 2.2, durSec: 1.4, note: 72, gain: 0.5 },
    { atSec: 2.2, durSec: 1.4, note: 76, gain: 0.5 },
    { atSec: 3.7, durSec: 0.9, note: 67, gain: 0.5 },
    { atSec: 3.7, durSec: 0.9, note: 71, gain: 0.5 },
    { atSec: 4.6, durSec: 0.9, note: 65, gain: 0.5 },
    { atSec: 4.6, durSec: 0.9, note: 69, gain: 0.5 },
    { atSec: 5.5, durSec: 1.3, note: 64, gain: 0.5 },
    { atSec: 5.5, durSec: 1.3, note: 67, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // The open fan: the line and its mirror, sometimes its octave flip.
  {
    id: 'one-line-choirs-hinge-of-violas',
    name: 'Hinge of violas',
    category: 'string',
    description:
      'Violas and, mostly under them, a warm clarinet that plays every step the other way round E; a dark plate behind.',
    preview: FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { fall: 0.3, centre: 2 },
      parts: {
        mirror: { deviceId: 'clarinet', preset: 'Warm clarinet', params: { volume: -5 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.12, release: 0.7, tone: 2000, ensemble: 0.35, volume: -3 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'one-line-choirs-two-fingers-part-ways',
    name: 'Two fingers part ways',
    category: 'organ',
    description:
      'Plain sawtooth pipes: thirds above D and their mirrors below move against each other, through a slow rotating horn and a spring.',
    preview: TWO_FINGERS,
    maker: { makerId: 'six-voices', preset: 'Open fan', params: { mirror: 0.9, fall: 0.2 } },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { attack: 0.03, release: 0.25, tone: 3200, high: 0.3, low: 0, volume: -10 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-cellos-fold-upward',
    name: 'Cellos fold upward',
    category: 'string',
    description:
      'Taped cellos sink from the centre while an alto flute climbs as far above it, on a quarter inch machine in a dark hall.',
    preview: VALLEY,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.85, fall: 0 },
      parts: {
        mirror: { deviceId: 'flute', preset: 'Alto flute', params: { volume: -13.5 } },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { attack: 0.1, release: 0.7, age: 0.2, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-spool-of-two-choirs',
    name: 'Spool of two choirs',
    category: 'voice',
    description:
      'A taped choir and its mirror at the same strength, however far apart, in a hall whose tail sings an open vowel.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.95, fall: 0, human: 0.5 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        attack: 0.12,
        release: 0.9,
        tone: 0.25,
        vibrato: 0.15,
        players: 0.35,
        spread: 0.6,
        volume: -6.5,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.25 } }],
  },
  {
    id: 'one-line-choirs-flutes-above-the-hinge',
    name: 'Flutes above the hinge',
    category: 'wind',
    description:
      'Still taped flutes round G with the mirror below them on the same tape and glass bars a little late on the octave flip.',
    preview: ROUND_G,
    maker: {
      makerId: 'six-voices',
      preset: 'Octave shadow',
      params: { mirror: 0.6, centreLevel: 0, octaflip: 0.6, delay: 0.15, centre: 4 },
      parts: {
        octaflip: { deviceId: 'fm-glass', preset: 'Chime bars', params: { volume: -11.5 } },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.06, release: 0.6, tone: 0.3, volume: -11 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-valley-for-two-horns',
    name: 'Valley for two horns',
    category: 'wind',
    description:
      'One horn going down and a breathy flugelhorn going up the same steps, both heard from across a room.',
    preview: VALLEY,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.9, fall: 0, human: 0.3 },
      parts: {
        mirror: {
          deviceId: 'horns',
          preset: 'Flugel breath',
          params: { release: 0.7, attack: 0.12, volume: -3.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.1, release: 0.7, volume: -1.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Across the room' }],
  },
  {
    id: 'one-line-choirs-mute-and-fretless',
    name: 'Mute and fretless',
    category: 'wind',
    description:
      'A muted trumpet round A and its mirror on a singing fretless bass, with one short echo in a small room.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.8, centre: -2, fall: 0.3 },
      parts: {
        mirror: { deviceId: 'string-bass', preset: 'Singing fretless', params: { volume: -2 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.05, release: 0.5, breath: 0.15, volume: -3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.18 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-mirrored-thirds-in-brass',
    name: 'Mirrored thirds in brass',
    category: 'wind',
    description:
      'A flugelhorn section in thirds, answered at once by thirds in contrary motion, softened by a fog that has no tail.',
    preview: TWO_FINGERS,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.7, fall: 0.6, human: 0.35 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.18, release: 0.6, blow: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'one-line-choirs-steel-and-shadow-harp',
    name: 'Steel and shadow harp',
    category: 'plucked',
    description:
      'Fingerpicked steel strings over the same tune upside down on a muted harp, lightly chorused.',
    preview: FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.9, fall: 0.2, centre: 0 },
      parts: {
        mirror: { deviceId: 'harp', preset: 'Muted harp', params: { volume: 1 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { release: 0.8, volume: 3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'one-line-choirs-nylon-with-a-box-above',
    name: 'Nylon with a box above',
    category: 'plucked',
    description:
      'Nylon strings go down, away from a high D, and a music box goes up from it, left to ring in a short halo of tuned strings.',
    preview: UNDER_HIGH,
    maker: {
      makerId: 'six-voices',
      preset: 'High round',
      params: { middle: 0, mirrorMiddle: 0, centreLevel: 0, mirror: 0.8, fall: 0.3 },
      parts: {
        mirror: { deviceId: 'modal-bells', preset: 'Music box', params: { volume: -2 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { release: 3, nail: 0.2, volume: -2.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { mix: 0.25 } },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'one-line-choirs-sine-pair-on-an-axle',
    name: 'Sine pair on an axle',
    category: 'pad',
    description:
      'A pure tone round D and its mirror on a breathy subtone reed, both in the same harmonic tremolo.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.75, fall: 0.5 },
      parts: {
        mirror: { deviceId: 'clarinet', preset: 'Subtone tenor', params: { volume: 1.5 } },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { attack: 0.3, release: 1.2, cutoff: 1600, volume: -6 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { mix: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-pulse-and-counterpulse',
    name: 'Pulse and counterpulse',
    category: 'keys',
    description:
      'A narrow pulse round A: three notes, the mirrors and the octaves below a hair late, sent through short soft tape repeats.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { centre: 5, mirror: 0.9, fall: 0, delay: 0.06, octaflip: 0.35 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { release: 0.35, cutoff: 3600, spread: 0.9, volume: -6.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.28 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'one-line-choirs-palm-and-tongue',
    name: 'Palm and tongue',
    category: 'bell',
    description:
      'Handpan notes above D and a steel tongue drum below it, step for step, on a small plate.',
    preview: FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.85, fall: 0 },
      parts: {
        mirror: { deviceId: 'handpan', preset: 'Tongue drum', params: { decay: 3, volume: 0.5 } },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Soft hands', params: { decay: 2.5, volume: 1.5 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
      { deviceId: 'spread', preset: 'Soft tilt' },
    ],
  },
  {
    id: 'one-line-choirs-trebles-over-basses',
    name: 'Trebles over basses',
    category: 'voice',
    description:
      'Boys on a round vowel over bass voices on an open one, moving apart round E and stopping an octave from it.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.9, fall: 0.1, human: 0.4, centre: 2 },
      parts: {
        mirror: { deviceId: 'choir', preset: 'Basses ah', params: { volume: -11.5 } },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.25, release: 1.4, volume: -5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
  },
  {
    id: 'one-line-choirs-tenors-in-a-folded-hall',
    name: 'Tenors in a folded hall',
    category: 'voice',
    description:
      'Tenors sinking to the low D, with the mirror and the octave flip opening above them, a few cents wide.',
    preview: VALLEY,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.75, octaflip: 0.5, fall: 0.2, human: 0.6 },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.15, release: 0.9, volume: -6.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-duet-with-its-reflection',
    name: 'Duet with its reflection',
    category: 'string',
    description:
      'Two quiet players and a straight-toned flute that crosses them round A, down when they go up, with a slow late vibrato.',
    preview: FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.8, fall: 0.2, delay: 0.08, centre: 5 },
      parts: {
        mirror: { deviceId: 'flute', preset: 'Straight tone', params: { volume: -12 } },
      },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { attack: 0.12, vibrato: 0, volume: -7 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'one-line-choirs-felt-keys-on-a-wood-axis',
    name: 'Felt keys on a wood axis',
    category: 'keys',
    description:
      'A close felted piano round A and its mirror on a soft marimba, kept dry under a little tape.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Open fan',
      params: { mirror: 0.9, centre: -2, fall: 0, human: 0.4 },
      parts: {
        mirror: { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: -11.5 } },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { resonance: 0.2, reverbMix: 0.1, polyphony: 16, outputDb: -15.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  // The filled fan: the middles between the line and its mirror.
  {
    id: 'one-line-choirs-ribs-of-the-fan',
    name: 'Ribs of the fan',
    category: 'pad',
    description:
      'An ensemble with all the ribs in: mirror, both middles and no centre, in a slow drifting chorus.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { mirrorMiddle: 0.45, fall: 0.5 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.35, release: 1.2, tone: 1800, low: 0.15, volume: -6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-glass-slats',
    name: 'Glass slats',
    category: 'pad',
    description:
      'String machine with its top octave full, round G, its two middles on a rubbed glass, thinned by a low cut.',
    preview: ROUND_G,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { centre: 4, middle: 0.55, mirrorMiddle: 0.5, fall: 0.3 },
      parts: {
        middle: { deviceId: 'fm-glass', preset: 'Rubbed glass', params: { volume: -16 } },
        'mirror-middle': { deviceId: 'fm-glass', preset: 'Rubbed glass', params: { volume: -16 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.15, release: 1, tone: 5000, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-low-fan-of-cellos',
    name: 'Low fan of cellos',
    category: 'string',
    description:
      'Dark sawtooth cellos sinking under a filled fan that gets quieter the further it opens, in a narrow cellar.',
    preview: VALLEY,
    maker: {
      makerId: 'six-voices',
      preset: 'Deep round',
      params: {
        centre: 1,
        mirror: 0.6,
        middle: 0.55,
        mirrorMiddle: 0.4,
        octaflip: 0,
        centreLevel: 0,
        fall: 2,
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.2, release: 0.8, tone: 900, low: 0.3, volume: -6.5 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.2 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'one-line-choirs-reel-of-folded-reeds',
    name: 'Reel of folded reeds',
    category: 'wind',
    description:
      'Taped reeds for the line and its mirror, hollow clarinets for the note halfway and a flugelhorn for that one turned over.',
    preview: FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'All six',
      params: {
        mirror: 0.6,
        middle: 0.6,
        mirrorMiddle: 0.55,
        octaflip: 0,
        centreLevel: 0,
        fall: 0.4,
      },
      parts: {
        middle: { deviceId: 'clarinet', preset: 'Hollow section', params: { volume: -5.5 } },
        'mirror-middle': {
          deviceId: 'horns',
          preset: 'Flugel breath',
          params: { attack: 0.1, release: 0.5, volume: -6.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.03, release: 0.3, volume: -12 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'one-line-choirs-cello-tape-in-slats',
    name: 'Cello tape in slats',
    category: 'string',
    description: 'Taped cellos round A, every chord a filled fan of four, pushed into hot tape.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { centre: -2, mirror: 0.55, middle: 0.6, mirrorMiddle: 0.5, fall: 0.8 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { tape: 1, attack: 0.15, release: 0.6, tone: -0.35, vibrato: 0.3, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-brass-at-half-the-angle',
    name: 'Brass at half the angle',
    category: 'wind',
    description:
      'Soft low brass for the line and its mirrors, flugelhorns halfway: ninth chords, then fourths, then fifths.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { centre: -2, mirror: 0.6, middle: 0.55, mirrorMiddle: 0.4, fall: 0.6 },
      parts: {
        middle: {
          deviceId: 'horns',
          preset: 'Flugel choir',
          params: { attack: 0.15, release: 0.6, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.1, release: 0.6, blow: 0.35, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'one-line-choirs-mutes-between-two-bells',
    name: 'Mutes between two bells',
    category: 'wind',
    description:
      'A muted section round E with celesta notes halfway up and halfway down, each a touch behind the key.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { centre: 2, middle: 0.7, mirrorMiddle: 0.7, mirror: 0.5, delay: 0.03, fall: 0 },
      parts: {
        middle: { deviceId: 'mallets', preset: 'Open celesta', params: { volume: -8 } },
        'mirror-middle': { deviceId: 'mallets', preset: 'Celesta', params: { volume: -5.5 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.2, release: 0.8, section: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Touch' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-ballad-with-its-inside',
    name: 'Ballad with its inside',
    category: 'wind',
    description:
      "One soft trumpet, and the line halfway between it and D on a warm reed, with that one's mirror faint below.",
    preview: CANON_LINE,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { mirror: 0, middle: 0.85, mirrorMiddle: 0.35, fall: 0.2 },
      parts: {
        middle: { deviceId: 'clarinet', preset: 'Ballad alto', params: { volume: -3 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { attack: 0.06, release: 0.6, vibrato: 0.4, volume: -3.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Plain echo', params: { mix: 0.18 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-four-courses-open',
    name: 'Four courses open',
    category: 'plucked',
    description:
      'A twelve-string opens from A minor seventh to wide fifths, its middles on a dark harp.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { mirror: 0.7, middle: 0.65, mirrorMiddle: 0.6, fall: 0.4, delay: 0.02 },
      parts: {
        middle: { deviceId: 'harp', preset: 'Dark hollow harp', params: { volume: -3 } },
        'mirror-middle': { deviceId: 'harp', preset: 'Dark hollow harp', params: { volume: -3 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { release: 1.2, strum: 5, volume: -2 },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-nylon-vibes-halfway',
    name: 'Nylon, vibes halfway',
    category: 'plucked',
    description:
      'Nylon strings with still vibraphone bars on both middles, the mirror kept low, all of it under a slow shimmer.',
    preview: FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { mirror: 0.35, middle: 0.6, mirrorMiddle: 0.6, fall: 0.2 },
      parts: {
        middle: { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -10 } },
        'mirror-middle': { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -10 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { release: 0.9, volume: -1.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water', params: { mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'one-line-choirs-vowels-fill-the-angle',
    name: 'Vowels fill the angle',
    category: 'pad',
    description:
      'Vowel waves that fill the whole angle round D, the line itself softest, with currents moving the bands.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { line: 0.45, mirror: 0.6, middle: 0.6, mirrorMiddle: 0.55, fall: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.3, release: 1.4, cutoff: 3200, sub: 0, volume: -7 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'imprint', preset: 'Faint vowel' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'one-line-choirs-reed-fan-on-the-fifth',
    name: 'Reed fan on the fifth',
    category: 'organ',
    description:
      'A soft wave reed round G with its mirror and both middles on the same reed, its body made a shade larger.',
    preview: ROUND_G,
    maker: {
      makerId: 'six-voices',
      preset: 'On the fifth',
      params: {
        hold: 0,
        centreLevel: 0,
        octaflip: 0,
        middle: 0.6,
        mirrorMiddle: 0.55,
        mirror: 0.55,
        fall: 0.3,
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.06, release: 0.5, cutoff: 1700, volume: -8.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'A shade larger' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-four-tongues-to-a-key',
    name: 'Four tongues to a key',
    category: 'bell',
    description:
      'A bright tongue drum opening from a close seventh chord to wide fifths, four notes a key, each a few hundredths after the last.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { mirror: 0.75, middle: 0.6, mirrorMiddle: 0.55, fall: 0.2, delay: 0.04, order: 2 },
    },
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { decay: 2.2, touch: 0.4, volume: -0.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-altos-between-the-walls',
    name: 'Altos between the walls',
    category: 'voice',
    description:
      'Altos on every rib of the fan, the near ones louder than the far, with a breath of tape flutter.',
    preview: FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'All six',
      params: {
        octaflip: 0,
        centreLevel: 0,
        mirror: 0.75,
        middle: 0.55,
        mirrorMiddle: 0.5,
        fall: 1.6,
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { attack: 0.12, release: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-humming-inside-the-fan',
    name: 'Humming inside the fan',
    category: 'voice',
    description:
      'Hummed line and mirror with a flute and a reed hum halfway, a fifth of a second of fog on every entrance.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { mirror: 0.7, middle: 0.5, mirrorMiddle: 0.45, fall: 0.3, human: 0.5 },
      parts: {
        middle: { deviceId: 'flute', preset: 'Canyon flute', params: { volume: -12 } },
        'mirror-middle': { deviceId: 'clarinet', preset: 'Reed hum', params: { volume: -3 } },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.3, release: 1.2, tone: 1400, volume: -6.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { size: 200, mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-choirs-consort-of-halves',
    name: 'Consort of halves',
    category: 'string',
    description:
      'A viol consort round A: one hand plays the top viol and the rule writes three more, dry but for a small chamber.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { centre: -2, mirror: 0.7, middle: 0.6, mirrorMiddle: 0.6, fall: 0, human: 0.4 },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.12, release: 0.4, volume: -6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-line-choirs-kalimba-ribs',
    name: 'Kalimba ribs',
    category: 'keys',
    description:
      'A bare piano with a kalimba on each middle, every key opening wider than the last.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Filled fan',
      params: { mirror: 0.7, middle: 0.7, mirrorMiddle: 0.6, fall: 0.5, human: 0.6 },
      parts: {
        middle: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -1 } },
        'mirror-middle': { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -1 } },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { resonance: 0.15, reverbMix: 0, polyphony: 16, outputDb: -8.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  // Over one held note: the centre stays down under the line, with the middle as a tenor that moves half as far.
  {
    id: 'one-line-choirs-tenor-at-half-the-step',
    name: 'Tenor at half the step',
    category: 'pad',
    description:
      'A hollow ensemble over a G held on a deep organ pedal; a tenor halfway between them moves half as far as the tune.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -3, middle: 0.6, centreLevel: 0.6, hold: 0.6, fall: 0.2 },
      parts: {
        centre: {
          deviceId: 'organ',
          preset: 'Deep pedal',
          params: { attack: 0.2, release: 0.8, volume: -13.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.1, release: 0.5, tone: 3000, volume: -5.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-bright-line-bowed-floor',
    name: 'Bright line, bowed floor',
    category: 'string',
    description:
      'A fast shimmering ensemble high over one bowed low C, the octave flip filling the space between.',
    preview: ROUND_G,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -7, octaflip: 0.45, centreLevel: 0.7, hold: 0.6, fall: 0 },
      parts: {
        centre: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.3, release: 0.8, volume: -6.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { attack: 0.06, release: 0.5, tone: 7000, volume: -3.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'one-line-choirs-thirds-on-a-still-d',
    name: 'Thirds on a still D',
    category: 'pad',
    description:
      'Muted violins in thirds round their own held D, every lower third a mirror, through a slow moving notch.',
    preview: TWO_FINGERS,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { mirror: 0.6, centre: 1, centreLevel: 0.75, hold: 0.5, fall: 0 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.15, release: 0.7, tone: 2000, volume: -6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-cello-strip-on-one-a',
    name: 'Cello strip on one A',
    category: 'string',
    description:
      'Taped cellos and their halfway tenor over an A that a soft bowed string holds, through a worn cassette at half strength.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -2, middle: 0.65, centreLevel: 0.6, hold: 0.5, fall: 0.3 },
      parts: {
        centre: {
          deviceId: 'bowed-string',
          preset: 'Soft flautando',
          params: { attack: 0.3, release: 0.8, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { attack: 0.08, release: 0.5, vibrato: 0.5, volume: -5.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-horns-under-a-high-glass',
    name: 'Horns under a high glass',
    category: 'wind',
    description:
      'Horn tape at normal speed sinking away from a rubbed glass that holds a D two octaves above its last note.',
    preview: VALLEY,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: 8, middle: 0.6, centreLevel: 0.65, hold: 0.6, fall: 0 },
      parts: {
        centre: {
          deviceId: 'fm-glass',
          preset: 'Rubbed glass',
          params: { attack: 0.3, release: 0.8, volume: -18 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.06, release: 0.5, volume: -5.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-one-d-for-a-whole-reel',
    name: 'One D for a whole reel',
    category: 'voice',
    description:
      'A worn taped choir, two notes and their middles over a low D that stays three seconds after the last key, in a slow orbit of itself.',
    preview: CALL,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -6, hold: 3, centreLevel: 0.65, middle: 0.5, fall: 0 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { attack: 0.15, release: 1.2, length: 9, hiss: 0.2, volume: -11.5 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.22 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'one-line-choirs-horn-on-a-low-brass-d',
    name: 'Horn on a low brass D',
    category: 'wind',
    description:
      'One horn over a D held by low brass, with another horn at half the distance, in an open valley.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -6, middle: 0.55, centreLevel: 0.65, hold: 0.5, fall: 0.2 },
      parts: {
        centre: {
          deviceId: 'horns',
          preset: 'Low brass choir',
          params: { attack: 0.4, release: 0.8, blow: 0.25, volume: -5.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.07, release: 0.5, breath: 0.1, volume: -1.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.2 } }],
  },
  {
    id: 'one-line-choirs-breath-over-a-throat',
    name: 'Breath over a throat',
    category: 'wind',
    description:
      'A breathy flugelhorn line from E to B over one D sung low by an overtone voice that keeps picking harmonics.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -6, centreLevel: 0.8, hold: 0.7, fall: 0.3 },
      parts: {
        centre: {
          deviceId: 'overtone',
          preset: 'Throat song',
          params: { attack: 0.2, release: 0.8, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.1, release: 0.6, volume: -2.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'one-line-choirs-bare-string-on-a-pedal',
    name: 'Bare string on a pedal',
    category: 'plucked',
    description:
      'A thin steel string over a D held by a pure pedal tone, the tune doubled an octave down by its flip.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -6, centreLevel: 0.7, hold: 0.4, octaflip: 0.35, fall: 0.1 },
      parts: {
        centre: { deviceId: 'ladder-bass', preset: 'Pure pedal', params: { volume: -16 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { release: 0.6, sustain: 4, volume: -5.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.2 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'one-line-choirs-twelve-strings-one-reed',
    name: 'Twelve strings, one reed',
    category: 'plucked',
    description:
      'A twelve-string over a G that a harmonium reed holds an octave and more below, with the note halfway plucked too.',
    preview: ROUND_G,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -3, middle: 0.5, centreLevel: 0.55, hold: 0.6, fall: 0.1 },
      parts: {
        centre: { deviceId: 'organ', preset: 'Harmonium', params: { release: 0.6, volume: -12.5 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { release: 0.6, tone: 0.7, volume: -0.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-waves-over-a-low-bed',
    name: 'Waves over a low bed',
    category: 'keys',
    description:
      'Struck glassy waves over an F held by a low filtered wave: the line and a tenor that moves half as far, in the Lydian mode.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -4, middle: 0.6, centreLevel: 0.55, hold: 0.6, fall: 0.2 },
      parts: {
        centre: {
          deviceId: 'wavetable',
          preset: 'Low bed',
          params: { attack: 0.4, release: 0.8, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 0.8, cutoff: 6000, volume: -7 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace' },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'one-line-choirs-flutter-over-one-vowel',
    name: 'Flutter over one vowel',
    category: 'voice',
    description:
      'A fluttering vowel wave repeats three notes over a D held by an overtone chant, quick enough to speak.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -6, centreLevel: 0.8, hold: 0.5, fall: 0, middle: 0.3 },
      parts: {
        centre: {
          deviceId: 'overtone',
          preset: 'Open vowels',
          params: { attack: 0.2, release: 0.8, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Vowel flutter',
      params: { attack: 0.04, release: 0.4, volume: -7.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thickener', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-hands-over-a-shruti',
    name: 'Hands over a shruti',
    category: 'bell',
    description:
      'A soft handpan tune over a D the bellows of a shruti box hold, with the octave flip tapped softly under it.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -6, centreLevel: 0.7, hold: 0.5, octaflip: 0.4, fall: 0 },
      parts: {
        centre: {
          deviceId: 'organ',
          preset: 'Shruti box',
          params: { attack: 0.2, release: 0.8, volume: -17.5 },
        },
      },
    },
    instrument: {
      deviceId: 'handpan',
      preset: 'Centre tone',
      params: { decay: 2.5, touch: 0.2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'Touch of sun' },
      { deviceId: 'glints', preset: 'Soft blips', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'one-line-choirs-soloist-on-one-spine',
    name: 'Soloist on one spine',
    category: 'voice',
    description: 'One voice with a wide vibrato over a D that low monks hold, in a vast nave.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -6, centreLevel: 0.75, hold: 0.6, fall: 0.2 },
      parts: {
        centre: {
          deviceId: 'choir',
          preset: 'Low monks',
          params: { attack: 0.4, release: 1.2, volume: -9.5 },
        },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.08, release: 0.5, volume: -7 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.25 } }],
  },
  {
    id: 'one-line-choirs-bow-across-a-still-a',
    name: 'Bow across a still A',
    category: 'string',
    description:
      'A close solo bow, breathy players halfway, and players with no vibrato who hold the A under both.',
    preview: OVER,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { centre: -2, middle: 0.6, centreLevel: 0.65, hold: 0.6, fall: 0.2 },
      parts: {
        centre: {
          deviceId: 'chamber-strings',
          preset: 'Still halo',
          params: { attack: 0.4, release: 0.8, volume: -7.5 },
        },
        middle: {
          deviceId: 'chamber-strings',
          preset: 'Whisper bows',
          params: { attack: 0.15, release: 0.5, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.1, release: 0.4, volume: -4.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-felt-thirds-over-a-bow',
    name: 'Felt thirds over a bow',
    category: 'keys',
    description:
      'Felt piano thirds doubled an octave down by their own flip, over one bowed A below them all.',
    preview: TWO_FINGERS,
    maker: {
      makerId: 'six-voices',
      preset: 'Over one note',
      params: { octaflip: 0.45, centre: -9, centreLevel: 0.6, hold: 0.5, fall: 0 },
      parts: {
        centre: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.3, release: 0.8, volume: -17 },
        },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { resonance: 0.2, reverbMix: 0.1, polyphony: 20, outputDb: -15.5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Just the ends' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { mix: 0.6 } },
    ],
  },
  // In canon: one voice after another, from an eighth of a second to one and a half.
  {
    id: 'one-line-choirs-flute-then-the-machine',
    name: 'Flute, then the machine',
    category: 'string',
    description:
      'Detuned saw strings answered half a second later by their mirror, then halfway by a soft flute, then by the last of four.',
    preview: CANON_LINE,
    maker: {
      makerId: 'six-voices',
      preset: 'Four in canon',
      params: { human: 0.2 },
      parts: {
        middle: { deviceId: 'flute', preset: 'Soft wind lead', params: { volume: -11 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.1, release: 0.6, tone: 1800, volume: -6.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-from-the-far-edge-in',
    name: 'From the far edge in',
    category: 'keys',
    description:
      'Saws with no ensemble, loosely doubled: each key brings the furthest voices first and the centre last, 0.8 seconds apart.',
    preview: CALL,
    maker: {
      makerId: 'six-voices',
      preset: 'Closing in',
      params: { delay: 0.8, fall: 0, centreLevel: 0.5 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.02, release: 0.7, tone: 2400, width: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.35 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'one-line-choirs-two-decks-apart',
    name: 'Two decks apart',
    category: 'wind',
    description:
      'A taped flute, its mirror on a bass clarinet, the mirror of its middle, its octave on a horn and the centre, one second apart.',
    preview: CALL,
    maker: {
      makerId: 'six-voices',
      preset: 'Long canon',
      params: { delay: 1, hold: 0.4, mirror: 0.7, octaflip: 0.6, centreLevel: 0.4 },
      parts: {
        mirror: {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { attack: 0.1, release: 0.5, volume: -5 },
        },
        octaflip: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.12, release: 0.7, volume: -5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { attack: 0.03, release: 0.4, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-reeds-by-twos',
    name: 'Reeds by twos',
    category: 'wind',
    description:
      'Taped reeds: the mirror with the octave on a rolled marimba, then both middles, then D, three quarters of a second apart.',
    preview: CANON_LINE,
    maker: {
      makerId: 'six-voices',
      preset: 'By twos',
      params: { octaflip: 0.5, middle: 0.5, mirrorMiddle: 0.5 },
      parts: {
        octaflip: { deviceId: 'mallets', preset: 'Rolled marimba', params: { volume: 2 } },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.04, release: 0.4, vibrato: 0.2, volume: -3 },
    },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back' },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'one-line-choirs-brass-round-at-the-hinge',
    name: 'Brass round at the hinge',
    category: 'wind',
    description:
      'A horn line, its mirror on a flugelhorn after four tenths of a second, then a muted trumpet and a tuba between them.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Four in canon',
      params: { delay: 0.4 },
      parts: {
        mirror: {
          deviceId: 'horns',
          preset: 'Flugel breath',
          params: { attack: 0.08, release: 0.5, volume: -3.5 },
        },
        middle: {
          deviceId: 'horns',
          preset: 'Muted distance',
          params: { release: 0.5, volume: -4 },
        },
        'mirror-middle': {
          deviceId: 'horns',
          preset: 'Soft tuba',
          params: { attack: 0.1, release: 0.5, volume: -5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.08, release: 0.5, vibrato: 0, volume: -1.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.2 } }],
  },
  {
    id: 'one-line-choirs-trombone-shadows-after',
    name: 'Trombone, shadows after',
    category: 'wind',
    description:
      'A trombone call round A; the voices come from the furthest to the nearest, a second apart, the two halfway on soft reeds.',
    preview: CALL_LOW,
    maker: {
      makerId: 'six-voices',
      preset: 'Closing in',
      params: { delay: 1, centre: -2, fall: 0.2, mirror: 0.6 },
      parts: {
        middle: {
          deviceId: 'clarinet',
          preset: 'Tenor swell',
          params: { attack: 0.1, release: 0.5, volume: -1 },
        },
        'mirror-middle': {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { volume: -4.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { release: 0.6, blow: 0.5, volume: -2.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { mix: 0.16 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'one-line-choirs-mutes-climbing-out',
    name: 'Mutes climbing out',
    category: 'wind',
    description:
      'A muted trumpet goes down while its mirror, two bells and its octave come up behind it, a third of a second apart.',
    preview: VALLEY,
    maker: {
      makerId: 'six-voices',
      preset: 'Four in canon',
      params: { mirror: 0.35, octaflip: 0.5, delay: 0.33, middle: 0.6, mirrorMiddle: 0.6, fall: 0 },
      parts: {
        middle: { deviceId: 'mallets', preset: 'Tremolo celesta', params: { volume: -1.5 } },
        'mirror-middle': { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -4 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.05, release: 0.5, section: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-water-down-the-bridge',
    name: 'Water down the bridge',
    category: 'plucked',
    description:
      'Nylon plucked near the bridge, the six voices falling from high to low a sixth of a second apart.',
    preview: CANON_LINE,
    maker: {
      makerId: 'six-voices',
      preset: 'Falling water',
      params: { delay: 0.16, octaflip: 0.5 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { release: 1.2, strum: 0, nail: 0.15, body: 1, tone: 0.55, sustain: 6, volume: 3 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -9 } },
      { deviceId: 'grain-delay', preset: 'Plain repeat', params: { mix: 0.2 } },
      { deviceId: 'prism', preset: 'Short chirp', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-a-bar-between-each-hand',
    name: 'A bar between each hand',
    category: 'plucked',
    description:
      'A steel string left ringing; the mirror comes a second and a half later, then a dark harp, the octave and the centre.',
    preview: CALL,
    maker: {
      makerId: 'six-voices',
      preset: 'Long canon',
      params: { delay: 1.5, hold: 1, octaflip: 0.6, mirrorMiddle: 0.7 },
      parts: {
        'mirror-middle': { deviceId: 'harp', preset: 'Dark hollow harp', params: { volume: -7 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { sustain: 8, release: 3, volume: -3 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails' },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
  },
  {
    id: 'one-line-choirs-bells-out-from-d',
    name: 'Bells out from D',
    category: 'bell',
    description:
      'Struck glass waves: behind each key its voices come outward from D, three tenths of a second apart, the outer ones on chimes.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Out from the middle',
      params: { delay: 0.3, line: 0.9 },
      parts: {
        mirror: { deviceId: 'fm-glass', preset: 'Ice chimes', params: { volume: -6 } },
        octaflip: { deviceId: 'fm-glass', preset: 'Chime bars', params: { volume: -11.5 } },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 1.2, cutoff: 5000, detune: 3, volume: -13 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
      { deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'one-line-choirs-the-tune-left-out',
    name: 'The tune left out',
    category: 'pad',
    description:
      'Hollow waves that never play the key itself: only its mirror, its middles and its octave, four tenths of a second apart.',
    preview: CANON_LINE,
    maker: {
      makerId: 'six-voices',
      preset: 'Hidden tune',
      params: { delay: 0.4, centreLevel: 0, human: 0.3 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.1, release: 0.8, cutoff: 2400, resonance: 0.15, volume: -6.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-answers-above-the-pan',
    name: 'Answers above the pan',
    category: 'bell',
    description:
      'A handpan line under a high D, answered every half second by a celesta, a kalimba and a music box above it.',
    preview: UNDER_HIGH,
    maker: {
      makerId: 'six-voices',
      preset: 'Bell answers',
      params: { delay: 0.5, octaflip: 0, centreLevel: 0.3 },
      parts: {
        mirror: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -1.5 } },
        middle: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: 0.5 } },
        'mirror-middle': { deviceId: 'modal-bells', preset: 'Music box', params: { volume: 5 } },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { decay: 3, volume: 1.5 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'one-line-choirs-quick-tongues-after-it',
    name: 'Quick tongues after it',
    category: 'plucked',
    description:
      'Dry steel notes with three followers an eighth of a second apart, none weaker for being far from D, in a small bright tank.',
    preview: CANON_LINE,
    maker: {
      makerId: 'six-voices',
      preset: 'Four in canon',
      params: { delay: 0.125, fall: 0, human: 0 },
    },
    instrument: { deviceId: 'handpan', preset: 'Clean steel', params: { decay: 1.5, volume: 1 } },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.22 } },
      { deviceId: 'glints', preset: 'Faint dust' },
    ],
  },
  {
    id: 'one-line-choirs-halo-by-pairs',
    name: 'Halo by pairs',
    category: 'bell',
    description:
      'A shimmering handpan whose other voices come in pairs six tenths of a second apart, the D last, panning slowly.',
    preview: CALL,
    maker: {
      makerId: 'six-voices',
      preset: 'By twos',
      params: { delay: 0.6, centreLevel: 0.5, fall: 0.2 },
    },
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 4, volume: -4 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.2 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'one-line-choirs-four-voices-in-four-rows',
    name: 'Four voices in four rows',
    category: 'voice',
    description:
      'A soprano, then the basses at her mirror, then altos and tenors between them, one second from row to row.',
    preview: CALL,
    maker: {
      makerId: 'six-voices',
      preset: 'Four in canon',
      params: { delay: 1, fall: 0.1 },
      parts: {
        mirror: { deviceId: 'choir', preset: 'Basses ah', params: { attack: 0.15, volume: -5.5 } },
        middle: {
          deviceId: 'choir',
          preset: 'Altos eh',
          params: { attack: 0.15, release: 1, volume: -8.5 },
        },
        'mirror-middle': {
          deviceId: 'choir',
          preset: 'Tenors oh',
          params: { attack: 0.15, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.1, vibrato: 14, release: 0.8, volume: -7 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'one-line-choirs-sextet-from-one-bow',
    name: 'Sextet from one bow',
    category: 'string',
    description:
      'One bow and five that follow it three tenths apart, nearest the centre first, the octave and the mirror on darker players.',
    preview: CANON_LINE,
    maker: {
      makerId: 'six-voices',
      preset: 'Out from the middle',
      params: { delay: 0.3, line: 1 },
      parts: {
        mirror: {
          deviceId: 'chamber-strings',
          preset: 'Viol consort',
          params: { attack: 0.08, release: 0.5, volume: -3.5 },
        },
        octaflip: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.12, release: 0.6, volume: -9.5 },
        },
      },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.08, release: 0.5, bow: 0.4, vibrato: 6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'one-line-choirs-short-bows-long-odds',
    name: 'Short bows, long odds',
    category: 'string',
    description:
      'Short bows that start far from D and close in every quarter second, with a soft marimba on the octave flip.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Closing in',
      params: { delay: 0.25, fall: 0.3, octaflip: 0.6 },
      parts: {
        octaflip: { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: 1.5 } },
      },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { release: 0.35, volume: -5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Dark trail', params: { mix: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-upright-answers-itself',
    name: 'Upright answers itself',
    category: 'keys',
    description:
      'An old upright, its mirror eight tenths later, then the mirror of its middle and its octave, over a soft D, on a new record.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Long canon',
      params: { delay: 0.8, hold: 0.5, octaflip: 0.3, centreLevel: 0.35 },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { resonance: 0.15, reverbMix: 0.08, polyphony: 20, outputDb: -8 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  // Rolled: the six voices as one spread chord, upward, downward, inward, outward or by pairs.
  {
    id: 'one-line-choirs-rolled-from-the-bass',
    name: 'Rolled from the bass',
    category: 'pad',
    description:
      'A bright ensemble round A, every key a chord rolled upward from its lowest note in three tenths of a second.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Rolled up',
      params: { delay: 0.06, centre: -2, octaflip: 0, centreLevel: 0.4, mirrorMiddle: 0.5 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.03, release: 0.5, tone: 5000, low: 0, ensemble: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-harp-at-the-tape-edge',
    name: 'Harp at the tape edge',
    category: 'string',
    description:
      'Taped strings that fall through the chord from the top, the mirror last on a harp close to its soundboard.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Falling water',
      params: { delay: 0.1, mirror: 0.85, octaflip: 0.35 },
      parts: {
        mirror: { deviceId: 'harp', preset: 'Near the soundboard', params: { volume: 6 } },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Strings run out',
      params: { release: 0.3, length: 5, hiss: 0.1, age: 0.4, volume: -6 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-brass-unfolds-outward',
    name: 'Brass unfolds outward',
    category: 'wind',
    description:
      'A soft brass band spread from D outward, one eighth of a second a voice, with an electric piano striking the D.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Out from the middle',
      params: { delay: 0.12, line: 1, octaflip: 0.3 },
      parts: {
        centre: { deviceId: 'tine-piano', preset: 'Soft suitcase', params: { volume: -6.5 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.06, release: 0.5, blow: 0.35, section: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { mix: 0.2 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'one-line-choirs-one-finger-six-strings',
    name: 'One finger, six strings',
    category: 'plucked',
    description:
      'A steel guitar strummed by the rule and not the hand: six strings from one key, low to high, in a fifth of a second.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Rolled up',
      params: { delay: 0.035, mirror: 0.75, octaflip: 0.55, human: 0.2 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { strum: 0, release: 0.9, sustain: 5, volume: -2.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-thumb-falls-from-g',
    name: 'Thumb falls from G',
    category: 'plucked',
    description:
      'A dark soft thumb round G, each chord falling through six strings from its top one, with a brief ring of tuned strings.',
    preview: ROUND_G,
    maker: {
      makerId: 'six-voices',
      preset: 'Falling water',
      params: { delay: 0.09, centre: 4, octaflip: 0.4 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { strum: 0, release: 0.8, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { mix: 0.7 } },
      { deviceId: 'sympathetic', preset: 'Brief pluck', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'one-line-choirs-courses-lifted-to-glass',
    name: 'Courses lifted to glass',
    category: 'plucked',
    description:
      'A detuned twelve-string under a high D, rolled upward into struck glass at the top of every chord.',
    preview: UNDER_HIGH,
    maker: {
      makerId: 'six-voices',
      preset: 'Rolled up',
      params: { delay: 0.07, centre: 8, octaflip: 0, centreLevel: 0.4, mirror: 0.6 },
      parts: {
        mirror: { deviceId: 'fm-glass', preset: 'Glass ping', params: { volume: -6 } },
        'mirror-middle': { deviceId: 'fm-glass', preset: 'Sine chimes', params: { volume: -11.5 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { strum: 0, release: 2, shimmer: 0.8, volume: -3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-spectrum-in-pairs',
    name: 'Spectrum in pairs',
    category: 'keys',
    description:
      'A still spectral wave with a quick attack: first mirror and octave, then both middles, then D, a fifth of a second a pair.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'By twos',
      params: { delay: 0.2, octaflip: 0.5, centreLevel: 0.5, fall: 0.3 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { attack: 0.02, release: 0.8, cutoff: 5200, volume: -6.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-beats-run-inward',
    name: 'Beats run inward',
    category: 'pad',
    description:
      'Two sines beating on every voice, coming in from the far ends of the chord to its centre an eighth of a second apart.',
    preview: CALL,
    maker: { makerId: 'six-voices', preset: 'Closing in', params: { delay: 0.13, fall: 0.4 } },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { attack: 0.04, release: 1.5, detune: 14, volume: -13.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-tongues-up-a-ladder',
    name: 'Tongues up a ladder',
    category: 'bell',
    description:
      'A tongue drum whose six notes climb from the lowest in four tenths of a second, loudest near D.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Rolled up',
      params: { delay: 0.08, fall: 1.6, octaflip: 0.5, human: 0.1 },
    },
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 1.8, touch: 0.45, position: 0.55, cavity: 0.25, sympathy: 0.2, volume: 2.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'bowls', preset: 'Short chime', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'one-line-choirs-palms-over-humming-wood',
    name: 'Palms over humming wood',
    category: 'plucked',
    description:
      'Muted palms round A and a humming marimba on mirror and middles, rolled from high to low.',
    preview: HALFWAY,
    maker: {
      makerId: 'six-voices',
      preset: 'Falling water',
      params: { delay: 0.09, centre: -2, octaflip: 0, centreLevel: 0.3 },
      parts: {
        mirror: { deviceId: 'mallets', preset: 'Humming marimba', params: { volume: -5 } },
        middle: { deviceId: 'mallets', preset: 'Humming marimba', params: { volume: -4.5 } },
        'mirror-middle': { deviceId: 'mallets', preset: 'Humming marimba', params: { volume: -5 } },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Palm mute', params: { decay: 1.6, volume: 0.5 } },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'one-line-choirs-edge-notes-open-upward',
    name: 'Edge notes open upward',
    category: 'bell',
    description:
      'Edge overtones of a steel pan, muffled; under a high C the chord spreads outward every seventh of a second.',
    preview: UNDER_HIGH,
    maker: {
      makerId: 'six-voices',
      preset: 'Out from the middle',
      params: { centre: 7, delay: 0.14, line: 1, octaflip: 0, mirror: 0.45 },
    },
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { decay: 2.2, touch: 0.35, volume: 4.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-choirs-bridge-bows-in-a-sweep',
    name: 'Bridge bows in a sweep',
    category: 'string',
    description:
      'Glassy bows near the bridge, swept upward a tenth of a second a player, under a very slow phaser.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'Rolled up',
      params: { delay: 0.1, octaflip: 0.35, mirror: 0.75 },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.07, release: 0.7, bow: 0.8, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-still-strings-strummed',
    name: 'Still strings strummed',
    category: 'keys',
    description:
      'Piano strings with no detune rolled upward from the lowest voice, with a concert harp on the octave flip, on a long plate.',
    preview: OPENING,
    maker: {
      makerId: 'six-voices',
      preset: 'Rolled up',
      params: { delay: 0.06, octaflip: 0.5, human: 0.3 },
      parts: {
        octaflip: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -0.5 } },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { resonance: 0.3, reverbMix: 0.05, polyphony: 20, outputDb: -10.5 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.18 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'one-line-choirs-glass-upright-spilling',
    name: 'Glass upright spilling',
    category: 'keys',
    description:
      'A bright stiff upright round G whose chords spill from the top, a ninth of a second a note, into a dotted echo.',
    preview: ROUND_G,
    maker: {
      makerId: 'six-voices',
      preset: 'Falling water',
      params: { delay: 0.11, centre: 4, octaflip: 0.35, mirrorMiddle: 0.4 },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { resonance: 0.1, reverbMix: 0.1, polyphony: 20, hardness: 0.8, outputDb: -3.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-line-choirs-thud-and-two-by-two',
    name: 'Thud and two by two',
    category: 'keys',
    description:
      'A felted thud of a piano, its mirror with the octave, then both middles on a marimba, a sixth of a second apart.',
    preview: SLOW_FAN,
    maker: {
      makerId: 'six-voices',
      preset: 'By twos',
      params: { delay: 0.16, octaflip: 0.45, middle: 0.55, mirrorMiddle: 0.55, centreLevel: 0 },
      parts: {
        middle: { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: -2.5 } },
        'mirror-middle': { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: -2.5 } },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { resonance: 0.2, reverbMix: 0.1, polyphony: 20, outputDb: -9.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  // A centre that walks: the key or the tune stays and the harmony goes round it.
  {
    id: 'one-line-choirs-three-octaves-one-hill',
    name: 'Three octaves, one hill',
    category: 'pad',
    description:
      'One key on three octaves of saws while the centre climbs D, E, G and comes home, a second and a half on each.',
    preview: HELD,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow hills',
      params: { walkTime: 1.5, hold: 0.5, mirror: 0.55, octaflip: 0.2, fall: 0.6 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.1, release: 0.6, tone: 2600, low: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Nearly dry' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.18 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'one-line-choirs-valley-of-slow-strings',
    name: 'Valley of slow strings',
    category: 'pad',
    description:
      'A held fifth on slow strings over an organ centre that sinks D, C, A and returns, the harmony following.',
    preview: HELD_FIFTH,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow valleys',
      params: { walkTime: 1.5, hold: 0.5, mirror: 0.5, octaflip: 0, fall: 0.5 },
      parts: {
        centre: {
          deviceId: 'organ',
          preset: 'Through the wall',
          params: { attack: 0.1, release: 0.6, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 0.4, release: 0.8, tone: 1500, low: 0.15, volume: -5 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Barely there' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-tune-stays-ground-turns',
    name: 'Tune stays, ground turns',
    category: 'pad',
    description:
      'Three notes played four times on detuned strings while the centre goes D, F, A, F on a sustained string below.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Turning chord',
      params: { walkTime: 1.6, hold: 0.8, delay: 0.06, centreLevel: 0.5, mirror: 0.5, middle: 0.5 },
      parts: {
        centre: { deviceId: 'bowed-string', preset: 'Quick sustain', params: { volume: -10 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.06, release: 0.4, tone: 3200, drift: 0.3, width: 0.9, volume: -6.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-pillars-on-cello-tape',
    name: 'Pillars on cello tape',
    category: 'string',
    description:
      'Cello tape holds one key and its octave; a tuba below steps from D to G, back and down to A, and the middle follows.',
    preview: HELD,
    maker: {
      makerId: 'six-voices',
      preset: 'Two pillars',
      params: { walkTime: 1.6, hold: 0.5, middle: 0.5, octaflip: 0.5, centreLevel: 0.7 },
      parts: {
        centre: {
          deviceId: 'horns',
          preset: 'Soft tuba',
          params: { attack: 0.15, release: 0.6, volume: -5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { speed: 0, attack: 0.15, release: 0.7, volume: -11 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-same-three-notes-uphill',
    name: 'Same three notes uphill',
    category: 'wind',
    description:
      'Taped flutes repeat three notes over mirrors hummed on a reed; a darker reed moves the centre, D, E, G and D again.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow hills',
      params: { walkTime: 1.6, hold: 0.8, mirror: 0.5, octaflip: 0, centreLevel: 0.5, fall: 0.4 },
      parts: {
        centre: { deviceId: 'clarinet', preset: 'Bass clarinet', params: { volume: -3 } },
        mirror: {
          deviceId: 'clarinet',
          preset: 'Reed hum',
          params: { attack: 0.05, release: 0.4, volume: -1.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { attack: 0.03, release: 0.3, vibrato: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-choirs-slowed-choir-breathing',
    name: 'Slowed choir, breathing',
    category: 'voice',
    description:
      'A slowed choir an octave under one held key, its centre swaying from A up to B, back, and down to G.',
    preview: HELD,
    maker: {
      makerId: 'six-voices',
      preset: 'Breathing',
      params: {
        walkTime: 1.6,
        hold: 0.5,
        centre: 5,
        mirror: 0.6,
        middle: 0.5,
        mirrorMiddle: 0.45,
        octaflip: 0,
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slowed choir',
      params: { attack: 0.3, release: 1.2, hiss: 0.15, volume: -11 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-horns-turn-on-one-note',
    name: 'Horns turn on one note',
    category: 'wind',
    description:
      'Horns hold one note while the centre walks the triad D, F, A, F and the voices under it change one after another.',
    preview: HELD,
    maker: {
      makerId: 'six-voices',
      preset: 'Turning chord',
      params: { walkTime: 1.5, hold: 0.5, delay: 0.1, mirror: 0.6, middle: 0.5 },
      parts: {
        centre: {
          deviceId: 'horns',
          preset: 'Low brass choir',
          params: { attack: 0.2, release: 0.7, volume: -3.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.12, release: 0.7, blow: 0.35, volume: -4.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } }],
  },
  {
    id: 'one-line-choirs-mutes-over-two-pillars',
    name: 'Mutes over two pillars',
    category: 'wind',
    description:
      'Muted trumpets say three notes four times over a fretless bass that plants D, G, D and A.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Two pillars',
      params: {
        walkTime: 1.6,
        hold: 0.8,
        middle: 0.45,
        octaflip: 0.5,
        centreLevel: 0.8,
        fall: 0.2,
      },
      parts: {
        centre: { deviceId: 'string-bass', preset: 'Singing fretless', params: { volume: 0 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.05, release: 0.35, section: 0.3, blow: 0.45, volume: -3 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.18 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'one-line-choirs-bridge-harp-goes-round',
    name: 'Bridge harp goes round',
    category: 'plucked',
    description:
      'Steel plucked at the bridge, the same three notes while the triad D, F, A, F turns underneath, quickly strummed.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Turning chord',
      params: {
        walkTime: 1.6,
        hold: 0,
        delay: 0.03,
        mirror: 0.6,
        middle: 0.55,
        mirrorMiddle: 0.45,
        centreLevel: 0.5,
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { strum: 0, release: 0.9, tone: 0.6, volume: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-choirs-glass-that-leans',
    name: 'Glass that leans',
    category: 'pad',
    description:
      'Glassy waves on one key whose centre leans D, E, D, C every second and a bit, each move a soft restrike.',
    preview: HELD,
    maker: {
      makerId: 'six-voices',
      preset: 'Breathing',
      params: { walkTime: 1.2, hold: 0.5, mirror: 0.6, middle: 0.6 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { attack: 0.12, release: 1, cutoff: 6000, sub: 0.05, volume: -6.5 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'one-line-choirs-saws-climb-under-a-fifth',
    name: 'Saws climb under a fifth',
    category: 'pad',
    description:
      'A dark bank of saws on two held keys, with a reed and flute pipes for the mirrors, as the centre climbs D, E, G.',
    preview: HELD_FIFTH,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow hills',
      params: { walkTime: 1.6, hold: 0.5, mirror: 0.6, octaflip: 0, fall: 0.3 },
      parts: {
        mirror: { deviceId: 'clarinet', preset: 'Subtone tenor', params: { volume: -7 } },
        'mirror-middle': { deviceId: 'organ', preset: 'Chapel flutes', params: { volume: -17 } },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.2, release: 0.9, cutoff: 1500, detune: 24, volume: -13 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Slow weather' },
      { deviceId: 'spectral-blur', preset: 'Softened attacks', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-line-choirs-tank-tune-moving-floor',
    name: 'Tank tune, moving floor',
    category: 'bell',
    description:
      'A tank drum repeats three notes and their mirrors while a pump organ holds a centre that climbs from D to E to G.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow hills',
      params: { walkTime: 1.6, hold: 0.8, mirror: 0.5, octaflip: 0, centreLevel: 0.6 },
      parts: {
        centre: { deviceId: 'organ', preset: 'Pump organ', params: { volume: -9 } },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Tank drum', params: { decay: 2, volume: 6 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Tilting tone' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-trebles-above-a-descent',
    name: 'Trebles above a descent',
    category: 'voice',
    description:
      'Drifting trebles hold a note, its octave and a middle that yields once; under them basses sink from D to C to A and back.',
    preview: HELD,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow valleys',
      params: { walkTime: 1.5, hold: 0.5, mirror: 0, middle: 0.6, octaflip: 0.4, fall: 0.4 },
      parts: {
        centre: {
          deviceId: 'choir',
          preset: 'Basses ah',
          params: { attack: 0.2, release: 0.8, volume: -5.5 },
        },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.2, release: 1.4, volume: -7 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { mix: 0.25 } },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'one-line-choirs-ee-on-a-turning-triad',
    name: 'Ee on a turning triad',
    category: 'voice',
    description:
      'Bright narrow vowels on a held fifth, thickened by a chorus; the note they turn round goes D, F, A, F.',
    preview: HELD_FIFTH,
    maker: {
      makerId: 'six-voices',
      preset: 'Turning chord',
      params: {
        walkTime: 1.6,
        hold: 0.5,
        delay: 0.15,
        mirror: 0.5,
        middle: 0.45,
        mirrorMiddle: 0.3,
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.2, release: 1.2, tone: 5200, volume: -7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-ragged-bows-on-a-hill',
    name: 'Ragged bows on a hill',
    category: 'string',
    description:
      'Six loose players on one key; every two seconds the centre climbs from D to E to G and the voices below move with it.',
    preview: HELD,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow hills',
      params: { walkTime: 2, hold: 0.5, mirror: 0.65, mirrorMiddle: 0.5, octaflip: 0, fall: 0.2 },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.2, release: 0.8, volume: -5.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Faint recall', params: { mix: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-lone-bow-sinking-floor',
    name: 'Lone bow, sinking floor',
    category: 'string',
    description:
      'A lone straight-toned bow plays three notes four times; under them a second bow sinks with the centre, D, C, A.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow valleys',
      params: {
        walkTime: 1.6,
        hold: 0.8,
        centreLevel: 0.65,
        mirror: 0,
        middle: 0.5,
        octaflip: 0.25,
      },
      parts: {
        centre: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.12, release: 0.6, volume: -13 },
        },
      },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { attack: 0.1, release: 0.5, volume: -5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-choirs-half-pedal-whole-walk',
    name: 'Half pedal, whole walk',
    category: 'keys',
    description:
      'A half-pedalled piano says three notes four times over a string that walks D, E, G and D, with another chord each time.',
    preview: TUNE,
    maker: {
      makerId: 'six-voices',
      preset: 'Slow hills',
      params: {
        walkTime: 1.6,
        hold: 0.8,
        mirror: 0.5,
        middle: 0.45,
        octaflip: 0,
        centreLevel: 0.45,
      },
      parts: {
        centre: {
          deviceId: 'chamber-strings',
          preset: 'Still halo',
          params: { attack: 0.15, release: 0.7, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { resonance: 0.2, reverbMix: 0.1, polyphony: 20, outputDb: -10.5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Margin' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.2 } },
    ],
  },
]
