import { type FactoryPreset, type Phrase } from '../types'

// A held chord as a section of players who agree never to take a breath together. Laid out by who has the
// air (lungs of two to eighteen seconds, dearer when loud, high or low), by where a player comes back, and by
// who sits beside whom: second desks and reliefs on other instruments. Attacks and releases are kept short
// enough that a breath is a gap, and the rooms small enough that it stays one.

// C major seventh in six, the notes unequally loud.
const LOFT: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 7.2, note: 67, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 71, gain: 0.65 },
  ],
}

// D minor ninth, the ninth on top: the middle quiet, the second voice from the top loud.
const GALLERY: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 57, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 65, gain: 0.3 },
    { atSec: 0, durSec: 7.2, note: 69, gain: 0.65 },
    { atSec: 0, durSec: 7.2, note: 76, gain: 0.45 },
  ],
}

// A minor ninth to F major seventh over the same A: bass and middle C stay down, E goes up to F, G and B come down.
const PEW_CHANGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 3.6, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.45 },
    { atSec: 0, durSec: 3.6, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 3.6, note: 71, gain: 0.6 },
    { atSec: 3.6, durSec: 3.6, note: 53, gain: 0.4 },
    { atSec: 3.6, durSec: 3.6, note: 64, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 69, gain: 0.6 },
  ],
}

// Three stacked fifths from D2 and the D two octaves over it: D A E B D, for voices that hold a ground.
const FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 38, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 52, gain: 0.55 },
    { atSec: 0, durSec: 7.2, note: 59, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.65 },
  ],
}

// D minor eleventh for eight players, wide at the bottom and close at the top.
const EIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 38, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 64, gain: 0.6 },
    { atSec: 0, durSec: 7.2, note: 67, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 74, gain: 0.6 },
  ],
}

// They sit down one at a time, from the middle outwards: A minor eleventh over E.
const PROCESSION: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.55 },
    { atSec: 0.5, durSec: 6.7, note: 64, gain: 0.5 },
    { atSec: 1, durSec: 6.2, note: 57, gain: 0.45 },
    { atSec: 1.5, durSec: 5.7, note: 67, gain: 0.6 },
    { atSec: 2, durSec: 5.2, note: 52, gain: 0.4 },
    { atSec: 2.5, durSec: 4.7, note: 74, gain: 0.5 },
  ],
}

// C major ninth from middle C up, for high voices.
const UPPER: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 67, gain: 0.55 },
    { atSec: 0, durSec: 7.2, note: 71, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 74, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 76, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 79, gain: 0.7 },
  ],
}

// G ninth with the fourth held in it, quiet at the bottom and loud on top: what loudness costs is heard.
const LOUD_TOP: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 43, gain: 0.3 },
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 57, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 7.2, note: 65, gain: 0.8 },
  ],
}

// D and A held while two voices move over them: D minor, G over D, A minor over D, and home by contrary motion.
const PEDAL_HYMN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 57, gain: 0.45 },
    { atSec: 0, durSec: 1.75, note: 65, gain: 0.45 },
    { atSec: 0, durSec: 1.75, note: 69, gain: 0.55 },
    { atSec: 1.75, durSec: 1.75, note: 67, gain: 0.45 },
    { atSec: 1.75, durSec: 1.75, note: 71, gain: 0.6 },
    { atSec: 3.5, durSec: 1.75, note: 69, gain: 0.5 },
    { atSec: 3.5, durSec: 1.75, note: 72, gain: 0.65 },
    { atSec: 5.25, durSec: 1.95, note: 65, gain: 0.4 },
    { atSec: 5.25, durSec: 1.95, note: 74, gain: 0.5 },
  ],
}

// F six-nine from F2, no semitone in it, so low chairs can change places.
const LOW_STALLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 57, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 67, gain: 0.6 },
  ],
}

// G ninth with a fourth to C major seventh: the bass falls a fifth, the upper three step down, the tenor up.
const CLOSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 43, gain: 0.5 },
    { atSec: 0, durSec: 3.6, note: 50, gain: 0.45 },
    { atSec: 0, durSec: 3.6, note: 57, gain: 0.55 },
    { atSec: 0, durSec: 3.6, note: 60, gain: 0.45 },
    { atSec: 0, durSec: 3.6, note: 65, gain: 0.65 },
    { atSec: 3.6, durSec: 3.6, note: 36, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 52, gain: 0.45 },
    { atSec: 3.6, durSec: 3.6, note: 55, gain: 0.55 },
    { atSec: 3.6, durSec: 3.6, note: 59, gain: 0.45 },
    { atSec: 3.6, durSec: 3.6, note: 64, gain: 0.65 },
  ],
}

// Fourths from D4 with a third on top, D minor eleventh, for five flutes.
const HIGH_FOURTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 67, gain: 0.6 },
    { atSec: 0, durSec: 7.2, note: 72, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 77, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 81, gain: 0.65 },
  ],
}

// A minor seventh for four singers, two of them loud.
const QUARTET: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 57, gain: 0.35 },
    { atSec: 0, durSec: 7.2, note: 64, gain: 0.65 },
    { atSec: 0, durSec: 7.2, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 72, gain: 0.6 },
  ],
}

// Four parts from A minor seventh to F major seventh: E and C are held through, A goes down to F and G up to A.
const QUARTET_TURNS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 64, gain: 0.6 },
    { atSec: 0, durSec: 3.6, note: 67, gain: 0.45 },
    { atSec: 0, durSec: 7.2, note: 72, gain: 0.6 },
    { atSec: 3.6, durSec: 3.6, note: 53, gain: 0.4 },
    { atSec: 3.6, durSec: 3.6, note: 69, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Horns.
  {
    id: 'never-breathe-together-six-horns-one-loft',
    name: 'Six horns, one loft',
    category: 'wind',
    description:
      'A small horn section on a chord of six, lungs of five seconds and one player at a time out for a breath, in a room.',
    preview: LOFT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Six in a loft',
      params: { lung: 5.05, breath: 0.9 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { section: 0.25, blow: 0.45, attack: 0.12, release: 0.5, volume: -9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } }],
  },
  {
    id: 'never-breathe-together-clarinet-next-chair',
    name: 'Clarinet, next chair',
    category: 'wind',
    description:
      'Flugelhorns and clarinets by turns round the chord, catching breaths of a third of a second, on a warm reel of tape.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 4 },
      parts: {
        second: {
          deviceId: 'clarinet',
          preset: 'Warm clarinet',
          params: { blow: 0.4, attack: 0.06, release: 0.25, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { section: 0.3, blow: 0.35, attack: 0.15, release: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, drive: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'never-breathe-together-mutes-change-desks',
    name: 'Mutes change desks',
    category: 'wind',
    description:
      'Muted trumpets that come back from a breath on the next free note of the chord, so the voicing turns over, in a spring.',
    preview: PROCESSION,
    maker: {
      makerId: 'breath-budget',
      preset: 'Turning voicing',
      params: { lung: 4.6, breath: 0.7, reach: 0, scatter: 0.85 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.6, breath: 0.15, attack: 0.06, release: 0.35, vibrato: 0.25, volume: -7 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.22 } }],
  },
  {
    id: 'never-breathe-together-trumpets-up-the-stair',
    name: 'Trumpets up the stair',
    category: 'wind',
    description:
      'Trumpets that climb a chord note with every breath, up to two octaves over the chord and at three fifths of their level, across a room.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Climbing choir',
      params: { lung: 4, breath: 0.6, level: 0.6 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.45, section: 0.4, attack: 0.2, release: 0.7, volume: -4 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Across the room',
        params: { distance: 0.5, room: 0.7, wander: 0.1 },
      },
    ],
  },
  {
    id: 'never-breathe-together-trombones-sit-lower',
    name: 'Trombones sit lower',
    category: 'wind',
    description:
      'Bare trombones that come back a chord note lower after each breath, over a bass that keeps its own note, through a triode.',
    preview: LOW_STALLS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Coming down',
      params: { lung: 4.5, breath: 1, level: 0.9, reach: 0 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { blow: 0.5, attack: 0.07, release: 0.3, vibrato: 0.1, volume: -6.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-octave-handed-over',
    name: 'Octave handed over',
    category: 'wind',
    description:
      'A soft flugelhorn chord whose players come back in another octave of their note, a clarinet taking every other breath of half of them.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Octave relay',
      params: { lung: 4, breath: 0.6, level: 0.8, reach: 0 },
      parts: {
        relief: {
          deviceId: 'clarinet',
          preset: 'Warm clarinet',
          params: { blow: 0.35, attack: 0.08, release: 0.4, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { breath: 0.3, attack: 0.18, release: 0.6, vibrato: 0.1, volume: -8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-appoggiatura-players',
    name: 'Appoggiatura players',
    category: 'wind',
    description:
      'Horns that lean: after a breath a player enters a step of the key off its note, and after the next comes home, in a slow chorus.',
    preview: QUARTET_TURNS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Leaning notes',
      params: { lung: 3.5, breath: 0.5, vary: 0.2, level: 0.95 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { section: 1, blow: 0.35, attack: 0.25, release: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-chairs-drawn-from-a-hat',
    name: 'Chairs drawn from a hat',
    category: 'wind',
    description:
      'Low brass and solo strings who come back on any free note of the chord, played again through a small amplifier in a room.',
    preview: LOW_STALLS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Change of seats',
      params: { lung: 4, breath: 0.5, reach: 0 },
      parts: {
        second: {
          deviceId: 'chamber-strings',
          preset: 'Close solo',
          params: { attack: 0.1, release: 0.3, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { section: 0.2, blow: 0.35, attack: 0.15, release: 0.4, volume: -4 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.15, distance: 0.5, mix: 0.8 },
      },
    ],
  },
  {
    id: 'never-breathe-together-top-chair-tires-first',
    name: 'Top chair tires first',
    category: 'wind',
    description:
      'A chord of trumpets with vibrato in which height is dear: the top note is gone soonest and the low ones outlast it, on a worn reel.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'High voices tire',
      params: { lung: 5, register: 1, weight: 0.4, scatter: 0, vary: 0.1, breath: 1 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { blow: 0.3, vibrato: 0.5, attack: 0.1, release: 0.5, volume: -5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, noise: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-tubas-run-short',
    name: 'Tubas run short',
    category: 'wind',
    description:
      'Soft tubas and horns by turns: the low notes cost most air, and even the lowest comes back on the next free chord note up.',
    preview: LOW_STALLS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Low voices tire',
      params: { lung: 6, breath: 1.1, level: 1, scatter: 0 },
      parts: {
        second: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { blow: 0.35, attack: 0.15, release: 0.5, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { blow: 0.35, breath: 0.2, attack: 0.15, release: 0.6, volume: -7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2, presence: -1 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'never-breathe-together-forte-costs-double',
    name: 'Forte costs double',
    category: 'wind',
    description:
      'Horns hard at work and bowed strings between them: a loud note is spent in a couple of seconds, a soft one outlasts the chord.',
    preview: LOUD_TOP,
    maker: {
      makerId: 'breath-budget',
      preset: 'Loud ones tire',
      params: { lung: 8, breath: 0.9, gap: 0.6, level: 0.85 },
      parts: {
        second: {
          deviceId: 'chamber-strings',
          preset: 'Warm section',
          params: { attack: 0.2, release: 0.5, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.75, section: 0.7, attack: 0.2, release: 0.6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 2.4, mix: 0.25, breathDepth: 0 } },
    ],
  },
  {
    id: 'never-breathe-together-three-counts-then-out',
    name: 'Three counts, then out',
    category: 'wind',
    description:
      'Muted brass whose lungs are all alike, about three seconds at any loudness, with a dark tape repeat in each place left.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'All lungs alike',
      params: { lung: 3.2, breath: 0.8, gap: 0.6 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { blow: 0.45, attack: 0.1, release: 0.3, section: 0.6, volume: -6 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 620, feedback: 0.25, highCut: 2400, mix: 0.3 },
      },
    ],
  },
  {
    id: 'never-breathe-together-two-off-the-mouthpiece',
    name: 'Two off the mouthpiece',
    category: 'wind',
    description:
      'Fifths and fourths on a flugelhorn section, two players silent at once for a second and a half, a small organ as their relief.',
    preview: LOUD_TOP,
    maker: {
      makerId: 'breath-budget',
      preset: 'Two at a time',
      params: { lung: 4, breath: 1.5, gap: 0.7 },
      parts: {
        relief: {
          deviceId: 'organ',
          preset: 'Chapel flutes',
          params: { attack: 0.06, release: 0.3, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { harmony: 0, section: 0.8, attack: 0.3, release: 0.6, volume: -8 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift', params: { depth: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { decay: 2.5, mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-half-the-brass-rises',
    name: 'Half the brass rises',
    category: 'wind',
    description:
      'A bright brass band of five in which three may be silent at once for nearly two seconds, and a player comes back on any free note.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Half the room',
      params: { lung: 4, most: 3, breath: 1.9, reach: 0 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.7, section: 0.8, attack: 0.1, release: 0.5, volume: -6.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'spread', preset: 'Open middle' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'never-breathe-together-slips-back-unheard',
    name: 'Slips back unheard',
    category: 'wind',
    description:
      'A loud first entry on flugelhorns and then returns at a quarter of it, so the section thins breath by breath as it goes on.',
    preview: LOFT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Soft returns',
      params: { lung: 5, level: 0.25, breath: 0.8 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { blow: 0.75, section: 0.5, breath: 0.35, attack: 0.08, release: 0.9, volume: -9 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Half open', params: { amount: 0.4 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'never-breathe-together-fourths-without-a-floor',
    name: 'Fourths without a floor',
    category: 'wind',
    description:
      'A horn chord in parallel fourths whose bass breathes and moves up like the rest, so nobody keeps the root for long.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'No floor',
      params: { lung: 4, breath: 0.7, reach: 0 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { attack: 0.2, release: 0.7, blow: 0.3, volume: -4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { decay: 0.5, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-hymn-over-two-pedals',
    name: 'Hymn over two pedals',
    category: 'wind',
    description:
      'Distant muffled horns for a slow hymn: the held pair takes breaths in turn while the moving voices pass above, short lungs on all.',
    preview: PEDAL_HYMN,
    maker: {
      makerId: 'breath-budget',
      preset: 'One player',
      params: { lung: 2.9, breath: 0.4, gap: 0.5, scatter: 0.6 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { blow: 0.5, section: 0.5, attack: 0.12, release: 0.5, vibrato: 0, volume: -2.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 1100, resonance: 0.8 } },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.45, wander: 0 } },
    ],
  },
  {
    id: 'never-breathe-together-air-kept-well-apart',
    name: 'Air kept well apart',
    category: 'texture',
    description:
      'A horn blown on almost nothing but air, players silent for nearly two seconds but never letting go within a second of each other.',
    preview: PROCESSION,
    maker: {
      makerId: 'breath-budget',
      preset: 'Far apart',
      params: { lung: 5, breath: 1.8, gap: 1 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { breath: 0.85, blow: 0.2, attack: 0.3, release: 0.8, volume: -5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },

  // Tape orchestra: each breath is also the strip drawn back to its start.
  {
    id: 'never-breathe-together-every-breath-rewinds',
    name: 'Every breath rewinds',
    category: 'string',
    description:
      'Worn taped violins, all with one lung however loud, that let go long before their strips run out and start them over.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'Section',
      params: { lung: 3.5, weight: 0, breath: 0.6, scatter: 0.9 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { attack: 0.05, release: 0.25, length: 9, tone: 0.1, volume: -9 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } }],
  },
  {
    id: 'never-breathe-together-cellos-in-the-balcony',
    name: 'Cellos in the balcony',
    category: 'string',
    description:
      'Taped cellos with low brass on every second seat, two players silent at once for over a second each, from the back of a hall.',
    preview: LOW_STALLS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Two at a time',
      params: { lung: 6.15, register: 0.3, breath: 1.4, gap: 0.8 },
      parts: {
        second: {
          deviceId: 'horns',
          preset: 'Low brass choir',
          params: { section: 0.2, blow: 0.3, attack: 0.2, release: 0.5, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { attack: 0.15, release: 0.5, volume: -4.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.4, level: 0.85 } },
    ],
  },
  {
    id: 'never-breathe-together-taped-flutes-take-turns',
    name: 'Taped flutes take turns',
    category: 'wind',
    description:
      'A dark crowd of taped flutes with quick catch breaths, whistling pipes on every second seat, under a tilting tremolo.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 3.9, breath: 0.4, gap: 0.5 },
      parts: {
        second: {
          deviceId: 'overtone',
          preset: 'High whistle',
          params: { overtone: 5, attack: 0.08, release: 0.3, volume: -13 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        hiss: 0.1,
        attack: 0.12,
        age: 0.6,
        tone: -0.7,
        players: 1,
        spread: 1,
        vibrato: 0.25,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Tilting tone', params: { depth: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'never-breathe-together-horns-at-half-pace',
    name: 'Horns at half pace',
    category: 'wind',
    description:
      'Half-speed taped horns an octave down whose players climb the chord as they return, opened out to both sides.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Turning voicing',
      params: { lung: 5, breath: 0.9, reach: 1, scatter: 0.85 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { attack: 0.12, release: 0.6, age: 0.3, tone: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 3, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-reeds-in-the-pit',
    name: 'Reeds in the pit',
    category: 'wind',
    description:
      'Orchestra reeds on tape that return a step off the note and then home, clarinets taking half of those leans, as from a small speaker.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Restless hymn',
      params: { lung: 3.5, gap: 0.4 },
      parts: {
        relief: {
          deviceId: 'clarinet',
          preset: 'Hollow section',
          params: { attack: 0.06, release: 0.2, volume: -8.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.05, release: 0.2, volume: -10 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Clean and bright',
        params: { speaker: 0, distance: 0.35, mix: 0.7 },
      },
    ],
  },
  {
    id: 'never-breathe-together-choir-of-five-strips',
    name: 'Choir of five strips',
    category: 'voice',
    description:
      'A taped choir on open fifths, each voice back in another octave after its breath, the hall behind it singing an ah.',
    preview: FIFTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Octave relay',
      params: { lung: 4.5, breath: 0.9, level: 0.75 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { release: 0.5, age: 0.3, volume: -10 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 2.5, mix: 0.3 } },
    ],
  },
  {
    id: 'never-breathe-together-worn-choir-stands-down',
    name: 'Worn choir stands down',
    category: 'voice',
    description:
      'A badly worn taped choir that comes back one chord note lower each time and softer, under record crackle and warp.',
    preview: QUARTET_TURNS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Coming down',
      params: { lung: 4, breath: 0.8, level: 0.7, bass: 0, reach: 0 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { attack: 0.12, release: 0.4, tone: -0.1, volume: -8 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.2, pops: 0.02 } }],
  },
  {
    id: 'never-breathe-together-slow-bows-any-seat',
    name: 'Slow bows, any seat',
    category: 'string',
    description:
      'A wide taped string section of eight where a player back from a breath sits wherever the chord is empty, in a lush chorus.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Change of seats',
      params: { scatter: 0.6, lung: 5.05, breath: 0.8, reach: 1 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.3, release: 0.7, volume: -7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Open', params: { low: -3, air: 3 } },
    ],
  },
  {
    id: 'never-breathe-together-reel-lost-found-again',
    name: 'Reel lost, found again',
    category: 'texture',
    description:
      'Half-speed flutes on a ruined tape whose voices are away two seconds at a time, three together, with echoes spacing themselves out.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'Far apart',
      params: { lung: 3.8, breath: 2, gap: 0.8 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { attack: 0.08, release: 0.5, hiss: 0.4, volume: -9.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.3 } }],
  },
  {
    id: 'never-breathe-together-low-bed-short-lungs',
    name: 'Low bed, short lungs',
    category: 'string',
    description:
      'Taped cellos under two chords, all lungs alike at two seconds and a half, a bowed solo string on every second seat.',
    preview: CLOSE,
    maker: {
      makerId: 'breath-budget',
      preset: 'All lungs alike',
      params: { lung: 2.35, breath: 0.6, gap: 0.5 },
      parts: {
        second: {
          deviceId: 'chamber-strings',
          preset: 'Close solo',
          params: { vibrato: 4, attack: 0.12, release: 0.3, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { speed: 0, attack: 0.15, release: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-low-strips-spend-most',
    name: 'Low strips spend most',
    category: 'wind',
    description:
      'Half-speed low reeds where depth is dear: the lower notes are the first to go and return in another octave, through a woody box.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Bass walks',
      params: { lung: 2.3, weight: 0, scatter: 0, register: -0.8, breath: 0.8 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: { attack: 0.1, release: 0.4, volume: -10 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.4 } }],
  },
  {
    id: 'never-breathe-together-violins-tire-of-height',
    name: 'Violins tire of height',
    category: 'string',
    description:
      'Clean thin taped strings with the treble paying most for its air and a wooden flute as its relief, with a faint phase over them.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'High voices tire',
      params: { lung: 8, register: 0.7, breath: 0.7, scatter: 0.8, level: 1 },
      parts: {
        relief: {
          deviceId: 'flute',
          preset: 'Canyon flute',
          params: { scoop: 10, chiff: 0.3, attack: 0.05, release: 0.3, volume: -11 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      params: {
        tape: 0,
        age: 0.05,
        hiss: 0,
        tone: 1,
        attack: 0.15,
        release: 0.6,
        players: 0.2,
        vibrato: 0.15,
        spread: 0.2,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.5, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-still-flutes-lean',
    name: 'Still flutes lean',
    category: 'wind',
    description:
      'Straight unworn taped flutes that come back a step away and then home, played in four voices with a dark echo behind them.',
    preview: QUARTET_TURNS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Leaning notes',
      params: { lung: 3, breath: 0.6, gap: 0.6, level: 0.9 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.1, release: 0.4, volume: -9 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 480, feedback: 0.35, mix: 0.28 },
      },
    ],
  },
  {
    id: 'never-breathe-together-sunken-back-desk',
    name: 'Sunken back desk',
    category: 'drone',
    description:
      'Dark half-speed strings with a soft choir on the second seat, four silent at once at most and gone two seconds, half under water.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Half the room',
      params: { lung: 5, breath: 2.2, back: 0 },
      parts: {
        second: {
          deviceId: 'choir',
          preset: 'Tenors oh',
          params: { attack: 0.2, release: 0.6, volume: -12.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Sunken strings',
      params: { attack: 0.5, release: 1, hiss: 0.3, vibrato: 0.5, volume: -7 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Half in', params: { bubbles: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'never-breathe-together-chorale-on-brown-tape',
    name: 'Chorale on brown tape',
    category: 'wind',
    description:
      'Taped horns for two slow chords over one bass, one player breathing at a time for half a second, on a fluttering cassette.',
    preview: PEW_CHANGE,
    maker: { makerId: 'breath-budget', preset: 'One player', params: { lung: 3, breath: 0.5 } },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.08, release: 0.35, age: 0.15, volume: -10 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2, drive: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },

  // Aurora: brass and strings that swell for as long as a breath lasts, and begin dark again after it.
  {
    id: 'never-breathe-together-swell-of-one-lung',
    name: 'Swell of one lung',
    category: 'pad',
    description:
      'A soft synthesised horn section in which each voice swells for one breath and starts dark again, with horns as its relief.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Section',
      params: { lung: 7, weight: 1.6, breath: 0.8, scatter: 0.9 },
      parts: {
        relief: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.15, release: 0.6, volume: -6 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.25, swell: 0.8, release: 0.8, volume: -9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } }],
  },
  {
    id: 'never-breathe-together-strings-swap-benches',
    name: 'Strings swap benches',
    category: 'string',
    description:
      'Wide synthesised strings for eight whose players return to any free note of the chord, with a close solo bow on each second seat.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Change of seats',
      params: { lung: 4.05, weight: 0.3, breath: 0.7 },
      parts: {
        second: {
          deviceId: 'chamber-strings',
          preset: 'Quiet duet',
          params: { attack: 0.15, release: 0.4, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.3, release: 0.8, volume: -7 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-night-watch-hands-over',
    name: 'Night watch hands over',
    category: 'voice',
    description:
      'A narrow vocal pad of four voices, two of which give every other breath to an oh-singing choir, swept slowly by a phaser.',
    preview: QUARTET_TURNS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 3.4, weight: 0.4, breath: 0.4, gap: 0.7 },
      parts: {
        relief: {
          deviceId: 'choir',
          preset: 'Tenors oh',
          params: { attack: 0.12, release: 0.4, volume: -5 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { attack: 0.2, release: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { decay: 2, mix: 0.22 } },
    ],
  },
  {
    id: 'never-breathe-together-metal-players-climb',
    name: 'Metal players climb',
    category: 'pad',
    description:
      'Ringing metal brass that comes back a chord note higher at each breath, up to two octaves over the chord, with sparse sparks above.',
    preview: LOUD_TOP,
    maker: {
      makerId: 'breath-budget',
      preset: 'Climbing choir',
      params: { lung: 5, register: -0.4, breath: 0.7 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.08, release: 1, volume: -10 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-bloom-cut-by-a-breath',
    name: 'Bloom cut by a breath',
    category: 'pad',
    description:
      'A dark pad whose wide filter bloom each breath cuts short, two voices silent at once, clarinets on the second desk, through a valve.',
    preview: PROCESSION,
    maker: {
      makerId: 'breath-budget',
      preset: 'Two at a time',
      params: { lung: 5, breath: 1.2, gap: 0.8 },
      parts: {
        second: {
          deviceId: 'clarinet',
          preset: 'Hollow section',
          params: { attack: 0.12, release: 0.4, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { attack: 0.6, release: 0.8, volume: -8 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { drive: 0.4, noise: 0.05, output: -2 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-brass-of-short-wind',
    name: 'Brass of short wind',
    category: 'wind',
    description:
      'Short synthesised brass on two chords, lungs of two seconds and a bit, each breath a hard new entry, in a tight spring tank.',
    preview: CLOSE,
    maker: {
      makerId: 'breath-budget',
      preset: 'One player',
      params: { lung: 2.6, breath: 0.5, gap: 0.5, scatter: 0.7 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { brilliance: 1300, release: 0.35, volume: -10 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 2, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-pipes-lean-and-mend',
    name: 'Pipes lean and mend',
    category: 'organ',
    description:
      'Still pipe tones whose voices return a step of the key away and then mend it, a wooden flute on the second desk, in a live room.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Leaning notes',
      params: { lung: 3.2, breath: 0.4, gap: 0.6 },
      parts: {
        second: {
          deviceId: 'flute',
          preset: 'Soft recorder',
          params: { attack: 0.06, release: 0.2, volume: -17 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { release: 0.4, brilliance: 1800, volume: -12 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Room', params: { size: 0.8, decay: 1.6, mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-loose-reeds-low-first',
    name: 'Loose reeds, low first',
    category: 'wind',
    description:
      'Badly tuned reeds in which the low notes cost most and walk off in octaves as they return, through a small speaker.',
    preview: LOW_STALLS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Bass walks',
      params: { lung: 5, breath: 0.6, register: -0.6 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { attack: 0.1, release: 0.4, volume: -9 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly', params: { speaker: 0, mix: 0.75 } }],
  },
  {
    id: 'never-breathe-together-mute-and-bowed-bell',
    name: 'Mute and bowed bell',
    category: 'wind',
    description:
      'A pinched muted trumpet tone with bowed bells on the second seat, the highest note tiring first, soft tape repeats behind.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'High voices tire',
      params: { lung: 6, register: 0.8, weight: 0.5, scatter: 0, breath: 0.8 },
      parts: {
        second: {
          deviceId: 'modal-bells',
          preset: 'Bowed bell',
          params: { decay: 4, release: 0.7, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { resonance: 0.7, release: 0.5, volume: -7 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 340, mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-silver-desk-steps-down',
    name: 'Silver desk steps down',
    category: 'string',
    description:
      'Thin silver strings that step down the chord breath by breath over dark clarinets on the second seat, and shimmer in bands.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Coming down',
      params: { lung: 4, breath: 0.7, scatter: 0.9 },
      parts: {
        second: {
          deviceId: 'clarinet',
          preset: 'Reed hum',
          params: { attack: 0.15, release: 0.5, volume: -11 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.3, release: 0.9, volume: -1.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-half-a-section-out',
    name: 'Half a section out',
    category: 'pad',
    description:
      'Slowly phasing saws for eight, up to four silent at once for two seconds, beating organ flutes as relief of every other seat.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Half the room',
      params: { lung: 4, breath: 2, back: 0, level: 1 },
      parts: {
        relief: {
          deviceId: 'organ',
          preset: 'Beating flutes',
          params: { attack: 0.1, release: 0.5, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow phasing',
      params: { brilliance: 3200, attack: 0.25, release: 1, volume: -9.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 2.5, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-struck-on-the-return',
    name: 'Struck on the return',
    category: 'bell',
    description:
      'Ring-modulated strings, so every breath ends in a small chime, two away at once and back in other octaves at two thirds of its level.',
    preview: LOFT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Octave relay',
      params: { lung: 4, most: 2, breath: 1.4, reach: 1 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { release: 1.2, brilliance: 3500, volume: -11 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Faint halo' }],
  },
  {
    id: 'never-breathe-together-melting-desk-no-root',
    name: 'Melting desk, no root',
    category: 'pad',
    description:
      'Metal strings that melt in slowly and leave gaps of a second, the bass climbing the chord with the rest, a low wind harp beside.',
    preview: LOUD_TOP,
    maker: {
      makerId: 'breath-budget',
      preset: 'No floor',
      params: { lung: 4.5, breath: 1, reach: 2, level: 0.8 },
      parts: {
        second: {
          deviceId: 'wind-harp',
          preset: 'Low hum',
          params: { release: 0.8, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Melting metal',
      params: { attack: 0.5, release: 1, volume: -3.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-vowel-opens-per-breath',
    name: 'Vowel opens per breath',
    category: 'voice',
    description:
      'A filter that says one vowel for every breath, three seconds to each lung whatever the loudness, its body made a little larger.',
    preview: PEW_CHANGE,
    maker: {
      makerId: 'breath-budget',
      preset: 'All lungs alike',
      params: { lung: 3, breath: 0.7, gap: 0.5 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.5, release: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'size', preset: 'A shade larger' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'never-breathe-together-deep-ground-dear-forte',
    name: 'Deep ground, dear forte',
    category: 'drone',
    description:
      'A dark low pad in which loudness is dear, a bass clarinet as relief, and every return kept to seven tenths.',
    preview: LOUD_TOP,
    maker: {
      makerId: 'breath-budget',
      preset: 'Loud ones tire',
      params: { lung: 7, breath: 1, gap: 0.6 },
      parts: {
        relief: {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { attack: 0.15, release: 0.5, volume: -1.5 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { brilliance: 450, attack: 0.8, release: 1.2, volume: -3 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 4, mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.2 } },
    ],
  },

  // Overtone voices: a ground that is never let go by everyone, each singer whistling over a breath.
  {
    id: 'never-breathe-together-whistlers-hold-a-fifth',
    name: 'Whistlers hold a fifth',
    category: 'drone',
    description:
      'Stacked fifths, every singer with one still whistled harmonic, low notes lasting and high ones not, in an open valley.',
    preview: FIFTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'High voices tire',
      params: { lung: 5, register: 0.5, breath: 0.8, scatter: 0.8 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { attack: 0.2, release: 0.7, volume: -10 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { decay: 3.5, mix: 0.25 } }],
  },
  {
    id: 'never-breathe-together-growl-beside-a-tuba',
    name: 'Growl beside a tuba',
    category: 'drone',
    description:
      'Growling low throats and soft tubas by turns up the fifths, the low ones out of breath first, in an iron-cored preamp.',
    preview: FIFTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Low voices tire',
      params: { lung: 4.9, breath: 0.9, scatter: 0, back: 0, bass: 1 },
      parts: {
        second: {
          deviceId: 'horns',
          preset: 'Soft tuba',
          params: { attack: 0.2, release: 0.6, volume: -5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { release: 0.6, volume: -12.5 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.25 } }],
  },
  {
    id: 'never-breathe-together-pipers-relieve-pipers',
    name: 'Pipers relieve pipers',
    category: 'organ',
    description:
      'A droning pipe, half of whose players hand every other breath to a small reed organ, with gaps of four tenths of a second.',
    preview: FIFTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 3.9, breath: 0.4, gap: 0.6 },
      parts: {
        relief: {
          deviceId: 'organ',
          preset: 'Pump organ',
          params: { attack: 0.06, release: 0.25, bellows: 0.3, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { attack: 0.08, release: 0.3, volume: -9 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.35 } }],
  },
  {
    id: 'never-breathe-together-jaws-taking-turns',
    name: 'Jaws taking turns',
    category: 'plucked',
    description:
      'A ring of twanging jaw harps with fast-moving harmonics, all lungs alike at two seconds and a half, two echoes thrown wide.',
    preview: PEW_CHANGE,
    maker: {
      makerId: 'breath-budget',
      preset: 'All lungs alike',
      params: { lung: 2.5, breath: 0.5, gap: 0.4 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { pace: 2.5, release: 0.25, volume: -12.5 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.25 } }],
  },
  {
    id: 'never-breathe-together-chant-finds-any-seat',
    name: 'Chant finds any seat',
    category: 'voice',
    description:
      'A slow throat chant for six that may return on any free note, its second desk of altos on eh, a faint vowel put on both.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Change of seats',
      params: { lung: 5.45, breath: 0.8, reach: 0 },
      parts: {
        second: {
          deviceId: 'choir',
          preset: 'Altos eh',
          params: { attack: 0.2, release: 0.6, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { attack: 0.2, release: 0.6, volume: -11 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Faint vowel' },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-air-pipe-and-neighbours',
    name: 'Air pipe and neighbours',
    category: 'wind',
    description:
      'Breathy pipes that lean to a neighbouring step and home at half-second breaths, low flutes on the second seat, swaying side to side.',
    preview: QUARTET_TURNS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Restless hymn',
      params: { lung: 3.6, breath: 0.5 },
      parts: {
        second: {
          deviceId: 'flute',
          preset: 'Low flute drone',
          params: { attack: 0.12, release: 0.5, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { attack: 0.12, release: 0.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-high-whistles-descend',
    name: 'High whistles descend',
    category: 'wind',
    description:
      'Whistling pipes, two away at once, back on the next lower note or round to the top, the bass too, in gusts of wind.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Coming down',
      params: {
        lung: 3.95,
        gap: 0.5,
        weight: 0,
        most: 2,
        breath: 0.9,
        bass: 0,
        reach: 0,
        level: 0.9,
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: { overtone: 11, attack: 0.1, release: 0.6, focus: 0.8, volume: -11 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.35, voice: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-vowels-exchanged',
    name: 'Vowels exchanged',
    category: 'voice',
    description:
      'Wandering open vowels from which two voices at a time are gone for over a second, and a soft flugelhorn that answers as relief.',
    preview: LOFT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Two at a time',
      params: { lung: 4.5, breath: 1.3, gap: 0.7, level: 1 },
      parts: {
        relief: {
          deviceId: 'horns',
          preset: 'Flugel breath',
          params: { attack: 0.15, release: 0.6, volume: -3.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { attack: 0.15, release: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.5, mix: 0.22 } },
    ],
  },
  {
    id: 'never-breathe-together-reed-singers-turn-over',
    name: 'Reed singers turn over',
    category: 'organ',
    description:
      'Reed-voiced drones that take the next free note at each return, five seats turning over one fixed bass, two empty at once, on hot tape.',
    preview: LOW_STALLS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Turning voicing',
      params: { lung: 4.85, most: 2, breath: 1.1, gap: 0.6, reach: 0, scatter: 0.9 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { attack: 0.12, release: 0.5, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { drive: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'never-breathe-together-quick-steps-far-octave',
    name: 'Quick steps, far octave',
    category: 'plucked',
    description:
      'Throats stepping quickly through their harmonics and back in another octave after a breath, rolled marimba as their relief.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Octave relay',
      params: { lung: 4.1, breath: 0.6, reach: 0, level: 0.9 },
      parts: {
        relief: {
          deviceId: 'mallets',
          preset: 'Rolled marimba',
          params: { damper: 0.5, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: { pace: 2, release: 0.4, volume: -11 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.25 } }],
  },
  {
    id: 'never-breathe-together-long-gaps-in-the-chant',
    name: 'Long gaps in the chant',
    category: 'drone',
    description:
      'A deep chant that loses up to three voices for nearly two seconds each and returns them one by one, its own octave added below.',
    preview: FIFTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Far apart',
      params: { lung: 4, breath: 1.8, gap: 0.8 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: { attack: 0.25, release: 0.8, volume: -13.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { dry: 1 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { decay: 3, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-air-whistle-rising-desk',
    name: 'Air whistle, rising desk',
    category: 'wind',
    description:
      'All air and one whistled partial, each voice up the chord and softer when it returns, a glass organ on the second seat.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Climbing choir',
      params: { lung: 3.5, breath: 0.8, level: 0.8, reach: 1 },
      parts: {
        second: {
          deviceId: 'fm-glass',
          preset: 'Glass organ',
          params: { attack: 0.1, release: 0.5, volume: -19 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Air whistle',
      params: { attack: 0.2, release: 0.6, volume: -11 },
    },
    effects: [{ deviceId: 'prism', preset: 'Faint trail' }],
  },
  {
    id: 'never-breathe-together-eight-throats-wide',
    name: 'Eight throats wide',
    category: 'voice',
    description:
      'A wide eight-part chord of throats whose voices come back at a third of their first level, the quiet parts raised again after.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Soft returns',
      params: { lung: 7, weight: 1.5, breath: 0.7, gap: 0.7 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Wide chord',
      params: { attack: 0.2, release: 0.7, volume: -12 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Gentle opening' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'never-breathe-together-glass-partials-dear',
    name: 'Glass partials, dear',
    category: 'bell',
    description:
      'A glassy top harmonic on each key, loud notes spent fastest, the second desk a soft rubbed glass, faint sines behind.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Loud ones tire',
      params: { lung: 6, breath: 0.8, gap: 0.5, level: 0.8 },
      parts: {
        second: {
          deviceId: 'modal-bells',
          preset: 'Glass harp',
          params: { decay: 3, release: 0.8, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { attack: 0.2, release: 0.8, volume: -10 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Nearly dry' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },

  // Flock: every return is a small group gliding in again.
  {
    id: 'never-breathe-together-lands-rests-lands',
    name: 'Lands, rests, lands',
    category: 'pad',
    description:
      'Small gliding voices that fly in from below again after each breath, one group of the chord at a time away for most of a second.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Six in a loft',
      params: { lung: 4.6, breath: 0.8 },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Evening flock',
      params: { gather: 0.5, leave: 1, volume: -9 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } }],
  },
  {
    id: 'never-breathe-together-whistlers-round-a-table',
    name: 'Whistlers round a table',
    category: 'wind',
    description:
      'One plain whistle to each key with short lungs and catch breaths, clarinets on every second seat, a late vibrato on what is held.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 3.15, gap: 0.6 },
      parts: {
        second: {
          deviceId: 'clarinet',
          preset: 'Warm clarinet',
          params: { attack: 0.08, release: 0.3, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { leave: 0.3, tone: 0.15, volume: -6 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 14 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'never-breathe-together-smear-with-seams-in-it',
    name: 'Smear with seams in it',
    category: 'pad',
    description:
      'A wide smeared swarm for eight whose seams are its breaths, three silent at once for a second and a half, a veiled choir on second desk.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Far apart',
      params: { lung: 5, breath: 1.6, gap: 0.7 },
      parts: {
        second: {
          deviceId: 'choir',
          preset: 'Distant choir',
          params: { attack: 0.25, release: 0.7, volume: -13 },
        },
      },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Wide smear',
      params: { gather: 0.7, stray: 0.5, leave: 1.2, volume: -13 },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-dawn-calls-in-relay',
    name: 'Dawn calls in relay',
    category: 'texture',
    description:
      'Chirping groups from all sides that come back in other octaves at two thirds, a wood flute as relief of every other group.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'Octave relay',
      params: { lung: 4, breath: 0.7, reach: 1 },
      parts: {
        relief: {
          deviceId: 'flute',
          preset: 'Canyon flute',
          params: { attack: 0.05, release: 0.4, scoop: 20, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Dawn calls',
      params: { chirp: 0.6, gather: 0.25, leave: 1, volume: -8 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Faint scatter', params: { mix: 0.2 } }],
  },
  {
    id: 'never-breathe-together-reeds-share-one-count',
    name: 'Reeds share one count',
    category: 'organ',
    description:
      'A choir of reedy small voices on two chords, each with the same three seconds however loud, in a slow rotating horn.',
    preview: CLOSE,
    maker: {
      makerId: 'breath-budget',
      preset: 'All lungs alike',
      params: { lung: 3.1, breath: 0.5, gap: 0.4 },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { gather: 0.2, leave: 0.5, octaves: 0.15, volume: -16 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'never-breathe-together-falling-into-their-seats',
    name: 'Falling into their seats',
    category: 'pad',
    description:
      'Voices that drop in from above, a chord note lower at each return, the bass too, horns on the second desk, sagging a little after.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Coming down',
      params: { lung: 4.5, breath: 0.9, bass: 0, reach: 0 },
      parts: {
        second: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.18, release: 0.6, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Falling in',
      params: { gather: 0.5, leave: 0.9, volume: -9 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.2 } }],
  },
  {
    id: 'never-breathe-together-cloud-thins-by-breaths',
    name: 'Cloud thins by breaths',
    category: 'texture',
    description:
      'A cloud of octaves on a high chord whose returns are a third as loud as its first entry, with a fifth rising faintly in its tail.',
    preview: UPPER,
    maker: { makerId: 'breath-budget', preset: 'Soft returns', params: { lung: 5, breath: 0.9 } },
    instrument: {
      deviceId: 'flock',
      preset: 'Octave cloud',
      params: { gather: 0.4, octaves: 0.6, tone: 0.1, leave: 1, volume: -9 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.22 } }],
  },
  {
    id: 'never-breathe-together-hollow-pairs-restless',
    name: 'Hollow pairs, restless',
    category: 'wind',
    description:
      'Hollow pairs for a hymn over two pedals, the upper of the held notes stepping off and back at each quick breath, on cassette.',
    preview: PEDAL_HYMN,
    maker: {
      makerId: 'breath-budget',
      preset: 'Restless hymn',
      params: { lung: 3, scatter: 0.6, breath: 0.4, gap: 0.8 },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { gather: 0.12, leave: 0.4, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-murmur-of-long-lungs',
    name: 'Murmur of long lungs',
    category: 'drone',
    description:
      'A reedy murmur on fifths, eighteen seconds of air each: a voice is missed every few seconds, for over two, cellos on the second seat.',
    preview: FIFTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Long lungs',
      params: { lung: 18, breath: 2.4 },
      parts: {
        second: {
          deviceId: 'tape-orchestra',
          preset: 'Cello section',
          params: { attack: 0.3, release: 0.8, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { gather: 1, leave: 1.5, stray: 0.25, volume: -13 },
    },
    effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.22 } }],
  },
  {
    id: 'never-breathe-together-glass-swarm-climbing',
    name: 'Glass swarm, climbing',
    category: 'bell',
    description:
      'A fluttering glass swarm, each group higher on return, up to two octaves over the chord, bowed metal on the second seat.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Climbing choir',
      params: { lung: 3.5, breath: 0.6, level: 0.85, bass: 0 },
      parts: {
        second: {
          deviceId: 'fm-glass',
          preset: 'Bowed metal',
          params: { attack: 0.15, release: 0.7, volume: -18 },
        },
      },
    },
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { gather: 0.35, flutter: 1.5, leave: 1, volume: -10 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Sparkle room', params: { mix: 0.18 } }],
  },

  // String machine: a section behind one panel.
  {
    id: 'never-breathe-together-always-one-missing',
    name: 'Always one missing',
    category: 'string',
    description:
      'A string ensemble for eight in which one player is nearly always resting, never two, for under a second, through its own chorus.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Six in a loft',
      params: { lung: 8, weight: 1.4, breath: 1, gap: 0.8 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.2, release: 0.6, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } }],
  },
  {
    id: 'never-breathe-together-violins-relieved',
    name: 'Violins, relieved',
    category: 'string',
    description:
      'Glassy top-octave strings, half of them relieved every other breath by two close bows, with height the dearest thing in the chord.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'High voices tire',
      params: { lung: 5.05, register: 0.8, breath: 0.6, level: 1 },
      parts: {
        relief: {
          deviceId: 'chamber-strings',
          preset: 'Close solo',
          params: { players: 2, attack: 0.15, release: 0.5, volume: -4.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.15, release: 0.6, tone: 4500, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { decay: 1.8, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-cellos-walk-their-bass',
    name: 'Cellos walk their bass',
    category: 'string',
    description:
      'Low octave strings where the bass tires first and goes walking in octaves, bass clarinets on each second seat.',
    preview: LOW_STALLS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Bass walks',
      params: { lung: 5.05, breath: 0.8, level: 1, scatter: 0 },
      parts: {
        second: {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { attack: 0.1, release: 0.4, volume: -9.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.2, release: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 2 } },
    ],
  },
  {
    id: 'never-breathe-together-dry-saws-in-a-ring',
    name: 'Dry saws in a ring',
    category: 'pad',
    description:
      'Dry saws without chorus that turn over inside the chord at every return, so the panel plays its own inversions, doubled by a short delay.',
    preview: PROCESSION,
    maker: {
      makerId: 'breath-budget',
      preset: 'Turning voicing',
      params: { lung: 3.35, breath: 0.5, reach: 0, bass: 0, scatter: 0.9, gap: 0.6 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { tone: 2600, attack: 0.05, release: 0.3, volume: -9.5 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.35 } }],
  },
  {
    id: 'never-breathe-together-section-half-asleep',
    name: 'Section half asleep',
    category: 'drone',
    description:
      'A foggy low panel with eleven seconds of air and two silent at once for three seconds, slowly opened and closed over eight.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Two at a time',
      params: { lung: 11.3, breath: 3, gap: 1 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { tone: 700, attack: 0.5, release: 1.2, volume: -8 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Asleep', params: { depth: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'never-breathe-together-pipes-with-no-floor',
    name: 'Pipes with no floor',
    category: 'organ',
    description:
      'A plain organ tone with a short release whose bass leaves its note like everyone else, given extra stops an octave up.',
    preview: QUARTET_TURNS,
    maker: {
      makerId: 'breath-budget',
      preset: 'No floor',
      params: { lung: 2.95, breath: 0.5, gap: 0.6, reach: 0 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { release: 0.15, tone: 1800, volume: -11.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Nearly dry', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'never-breathe-together-muted-row-one-flute',
    name: 'Muted row, one flute',
    category: 'string',
    description:
      'A muted upper row returning on any free note within an octave over the chord, flutes on every second seat, a slow pulsing reverb.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Change of seats',
      params: { lung: 4.5, breath: 0.7, reach: 1 },
      parts: {
        second: {
          deviceId: 'flute',
          preset: 'Soft wind lead',
          params: { attack: 0.1, release: 0.4, volume: -18 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.2, release: 0.6, volume: -8 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Slow tide', params: { mix: 0.2 } }],
  },
  {
    id: 'never-breathe-together-violas-lean-on-a-hymn',
    name: 'Violas lean on a hymn',
    category: 'string',
    description:
      'Violas for a hymn over two pedals, the upper pedal leaning a step away at each breath, panned slowly from side to side.',
    preview: PEDAL_HYMN,
    maker: {
      makerId: 'breath-budget',
      preset: 'Leaning notes',
      params: { lung: 3.2, scatter: 0.75, breath: 0.4, gap: 0.8 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.12, release: 0.45, volume: -4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
  },

  // Choir.
  {
    id: 'never-breathe-together-tenors-stagger-it',
    name: 'Tenors stagger it',
    category: 'voice',
    description:
      'Tenors on oh who stagger their breathing, catch breaths of a third of a second, each of a different length, in a church.',
    preview: LOFT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 4.75, vary: 0.5, gap: 0.6, scatter: 0.9 },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.1, release: 0.4, volume: -10 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 2.8, mix: 0.22 } }],
  },
  {
    id: 'never-breathe-together-trebles-and-recorders',
    name: 'Trebles and recorders',
    category: 'voice',
    description:
      'High voices on oo and soft recorders by turns, a treble back on the next higher chord note after each breath, under a light plate.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Turning voicing',
      params: { lung: 4.5, breath: 0.7, reach: 0, scatter: 0.9 },
      parts: {
        second: {
          deviceId: 'flute',
          preset: 'Soft recorder',
          params: { attack: 0.08, release: 0.25, volume: -15.5 },
        },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.2, release: 0.6, volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.25 } }],
  },
  {
    id: 'never-breathe-together-humming-row-loud-first',
    name: 'Humming row, loud first',
    category: 'voice',
    description:
      'A row humming with closed lips in which the loud ones run out first and come back softer, a muted string pair as their relief.',
    preview: LOUD_TOP,
    maker: {
      makerId: 'breath-budget',
      preset: 'Loud ones tire',
      params: { lung: 6, breath: 0.8, gap: 0.6 },
      parts: {
        relief: {
          deviceId: 'chamber-strings',
          preset: 'Quiet duet',
          params: { attack: 0.15, release: 0.5, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { tone: 1000, attack: 0.2, release: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Gentle' },
      { deviceId: 'distance', preset: 'A few steps back', params: { wander: 0 } },
    ],
  },
  {
    id: 'never-breathe-together-monks-of-the-long-office',
    name: 'Monks of the long office',
    category: 'voice',
    description:
      'Low monks with fourteen seconds of air who rest two and a half and return at two fifths, on a drone of stacked fifths.',
    preview: FIFTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Soft returns',
      params: { lung: 14, breath: 2.5, level: 0.4 },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.5, release: 1.2, volume: -9 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 4, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-half-the-row-draws-air',
    name: 'Half the row draws air',
    category: 'voice',
    description:
      'A glassy row on ee for eight, up to four silent at once for nearly two seconds and any seat taken after, its air spread wide.',
    preview: EIGHT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Half the room',
      params: { lung: 3.95, breath: 1.8, level: 1 },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { breath: 0.4, attack: 0.25, release: 0.7, volume: -11 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-wavers-off-sings-home',
    name: 'Wavers off, sings home',
    category: 'voice',
    description:
      'A slow-wavering row of singers that enter a step of the key away after one breath and home after the next, through a small clean radio.',
    preview: QUARTET_TURNS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Leaning notes',
      params: { lung: 3.5, breath: 0.6, gap: 0.7 },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { vibrato: 22, attack: 0.2, release: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { bandwidth: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'never-breathe-together-soloists-hand-it-on',
    name: 'Soloists hand it on',
    category: 'voice',
    description:
      'Single singers with wide vibrato on two chords, short lungs and one out at a time, a small flute organ on every second seat.',
    preview: PEW_CHANGE,
    maker: {
      makerId: 'breath-budget',
      preset: 'One player',
      params: { lung: 3, breath: 0.5 },
      parts: {
        second: {
          deviceId: 'organ',
          preset: 'Tremulant flute',
          params: { tremulant: 0.2, attack: 0.08, release: 0.3, volume: -12 },
        },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 24, attack: 0.1, release: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 2, breathDepth: 0, mix: 0.22 } },
    ],
  },

  // Flutes: the instrument with the least air of all.
  {
    id: 'never-breathe-together-flutes-short-of-air',
    name: 'Flutes short of air',
    category: 'wind',
    description:
      'Five concert flutes with under three seconds each, one at a time silent for four tenths of a second, close and nearly dry.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 3.2, breath: 0.4, gap: 0.4 },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { chiff: 0.35, release: 0.25, vibrato: 0.2, volume: -12.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } }],
  },
  {
    id: 'never-breathe-together-bamboo-climbs-and-dims',
    name: 'Bamboo climbs and dims',
    category: 'wind',
    description:
      'Vibrato bamboo flutes that climb the chord and come back dimmer, with a glass organ on every second seat, repeats slowing away.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'Climbing choir',
      params: { lung: 7, register: 0.4, breath: 0.8, reach: 1 },
      parts: {
        second: {
          deviceId: 'fm-glass',
          preset: 'Glass organ',
          params: { attack: 0.08, release: 0.5, volume: -18 },
        },
      },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { scoop: 30, vibrato: 0.6, attack: 0.12, release: 0.5, volume: -9 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.2 } }],
  },
  {
    id: 'never-breathe-together-pan-row-changes-pipes',
    name: 'Pan row changes pipes',
    category: 'wind',
    description:
      'A row of chiffing pan pipes, each player back on any free pipe of the chord, coloured by a hollow tube, with springs.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Change of seats',
      params: { lung: 3.5, breath: 0.5, gap: 0.5, reach: 0 },
    },
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { release: 0.3, volume: -13 } },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 2, mix: 0.18 } },
    ],
  },
  {
    id: 'never-breathe-together-low-flutes-two-away',
    name: 'Low flutes, two away',
    category: 'wind',
    description:
      'Low flutes with two of six away at once for a second and a half, a flugelhorn as relief of every other seat, in a morning fog.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'Two at a time',
      params: { lung: 5.2, breath: 1.5, gap: 0.7 },
      parts: {
        relief: {
          deviceId: 'horns',
          preset: 'Flugel breath',
          params: { section: 0, attack: 0.15, release: 0.5, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { blow: 0.5, chiff: 0.35, attack: 0.1, release: 0.5, volume: -16 },
    },
    effects: [{ deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.35 } }],
  },
  {
    id: 'never-breathe-together-whisper-row',
    name: 'Whisper row',
    category: 'texture',
    description:
      'Pipes that are mostly air, all lungs alike at three seconds, so the hiss itself passes round the six, rolling slowly left and right.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'All lungs alike',
      params: { lung: 3, breath: 0.8, gap: 0.5 },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.15, release: 0.5, volume: -14 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { depth: 0.5 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { decay: 4 } },
    ],
  },
  {
    id: 'never-breathe-together-straight-tones-octaves',
    name: 'Straight tones, octaves',
    category: 'wind',
    description:
      'Straight flutes that exchange octaves breath by breath, a rubbed bowl on every second seat and a smaller body mixed with their own.',
    preview: UPPER,
    maker: {
      makerId: 'breath-budget',
      preset: 'Octave relay',
      params: { lung: 4.5, breath: 0.7, reach: 1, level: 0.9 },
      parts: {
        second: {
          deviceId: 'modal-bells',
          preset: 'Rubbed bowl',
          params: { decay: 4, release: 0.8, hardness: 0.1, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.12, release: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.5, mix: 0.18 } },
    ],
  },
  {
    id: 'never-breathe-together-recorders-bass-lets-go',
    name: 'Recorders, bass lets go',
    category: 'wind',
    description:
      'A consort of plain recorders in which low notes cost most and even the lowest moves up the chord, gaps under half a second.',
    preview: HIGH_FOURTHS,
    maker: {
      makerId: 'breath-budget',
      preset: 'Low voices tire',
      params: { lung: 2.3, breath: 0.45, gap: 0.6, level: 1, weight: 0, scatter: 0 },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { blow: 0.2, release: 0.2, volume: -15.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // Thesis: filtered noise, each key with its reflections, breathing as one voice.
  {
    id: 'never-breathe-together-noise-choir-in-turns',
    name: 'Noise choir in turns',
    category: 'pad',
    description:
      'Glassy bands of noise with their mirrors, every voice and its reflections gone together for a second and back, in an even room.',
    preview: QUARTET,
    maker: {
      makerId: 'breath-budget',
      preset: 'Section',
      params: { lung: 7, weight: 1.8, breath: 1, scatter: 0.9 },
    },
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { attack: 0.25, release: 0.8, mode: 0, octaflipEnabled: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-breath-with-a-pitch',
    name: 'Breath with a pitch',
    category: 'texture',
    description:
      'Plain pitched noise without any reflection that climbs the chord at each return, horns as relief, through a slowly moving low-pass.',
    preview: LOUD_TOP,
    maker: {
      makerId: 'breath-budget',
      preset: 'Turning voicing',
      params: { lung: 4.5, breath: 0.8, reach: 1, scatter: 0.9 },
      parts: {
        relief: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.15, release: 0.5, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'thesis',
      preset: 'Chromatic whistle',
      params: { resonance: 70, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { type: 0, cutoffHz: 1800, resonance: 0.9, lfoAmount: 35, lfoRateHz: 0.15 },
      },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling', params: { outputGain: -0.5 } },
    ],
  },
  {
    id: 'never-breathe-together-two-desks-of-breath',
    name: 'Two desks of breath',
    category: 'pad',
    description:
      'Breathing bands in a five-note scale and clarinets on the second desk, two silent at once for over a second, limited.',
    preview: PROCESSION,
    maker: {
      makerId: 'breath-budget',
      preset: 'Two at a time',
      params: { lung: 4.6, breath: 1.2, gap: 0.6 },
      parts: {
        second: {
          deviceId: 'clarinet',
          preset: 'Hollow section',
          params: { attack: 0.12, release: 0.4, volume: -13 },
        },
      },
    },
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: { attack: 0.15, release: 0.6, octaflipEnabled: 0 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 6 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { decay: 0.5, mix: 0.2 } },
    ],
  },
  {
    id: 'never-breathe-together-strummed-on-the-inhale',
    name: 'Strummed on the inhale',
    category: 'plucked',
    description:
      'Narrow ringing bands strummed from a note to its mirror each time a voice returns, the four of them short of air, with a faint tape echo.',
    preview: QUARTET,
    maker: { makerId: 'breath-budget', preset: 'One player', params: { lung: 2.8, breath: 0.5 } },
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: {
        scale: 4,
        root: 2,
        center: 57,
        resonance: 85,
        width: 20,
        release: 0.6,
        strum: 100,
        middleEnabled: 0,
        centerEnabled: 1,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch' },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'never-breathe-together-nine-seconds-of-air',
    name: 'Nine seconds of air',
    category: 'drone',
    description:
      'Wide noise drawn to its centre note, nine seconds of air to a voice and two silent at once, one lost every second and a half.',
    preview: GALLERY,
    maker: {
      makerId: 'breath-budget',
      preset: 'Far apart',
      params: { lung: 9, breath: 2.5, gap: 1.5 },
    },
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: { attack: 0.3, release: 1.2, resonance: 45, middleEnabled: 0 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Nearly still' },
      {
        deviceId: 'fet-limiter',
        preset: 'Lower ceiling',
        params: { inputGain: 4, outputGain: -2 },
      },
    ],
  },

  // One more strip.
  {
    id: 'never-breathe-together-evening-at-half-pace',
    name: 'Evening at half pace',
    category: 'voice',
    description:
      'A slowed taped choir on an unhurried chord, ten seconds of air and one voice away at a time for a second and a half, an organ beside.',
    preview: LOFT,
    maker: {
      makerId: 'breath-budget',
      preset: 'Long lungs',
      params: { lung: 9.8, breath: 2, gap: 1.2 },
      parts: {
        second: {
          deviceId: 'organ',
          preset: 'Chapel flutes',
          params: { attack: 0.1, release: 0.5, volume: -13.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slowed choir',
      params: { attack: 0.4, release: 1.2, hiss: 0.2, volume: -9 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -50 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.2 } },
    ],
  },
]
