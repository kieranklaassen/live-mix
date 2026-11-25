import { type FactoryPreset, type Phrase } from '../types'

// A quartet that stops no string: cello and viola C G D A, violins G D A E, bowed and plucked open.
// Laid out by manner (open, muted, at the bridge, over the fingerboard, touched in harmonics), then
// by how many players, how fast the bow speaks, how far away they sit. No vibrato anywhere, and the
// previews are tuned the way a quartet tunes: from A, in fifths with no beat in them.

// Cello C G D A, viola D A, violin E: the whole stack of fifths, the bows half a beat apart.
const STACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 6, note: 35.94, gain: 0.5 },
    { atSec: 0.4, durSec: 5.6, note: 42.96, gain: 0.5 },
    { atSec: 0.8, durSec: 5.2, note: 49.98, gain: 0.45 },
    { atSec: 1.2, durSec: 4.8, note: 57, gain: 0.45 },
    { atSec: 1.6, durSec: 4.4, note: 61.98, gain: 0.4 },
    { atSec: 2, durSec: 4, note: 69, gain: 0.4 },
    { atSec: 2.4, durSec: 3.6, note: 76.02, gain: 0.35 },
  ],
}

// C G D A becomes G D A E: three strings hold, the lowest stops, and one enters at the top.
const HINGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 35.94, gain: 0.5 },
    { atSec: 0, durSec: 6, note: 42.96, gain: 0.5 },
    { atSec: 0, durSec: 6, note: 61.98, gain: 0.45 },
    { atSec: 0, durSec: 6, note: 69, gain: 0.4 },
    { atSec: 3, durSec: 3, note: 76.02, gain: 0.4 },
  ],
}

// Cello G D A, viola G D, violin A E: the stack on G, player by player.
const TASTO: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 42.96, gain: 0.5 },
    { atSec: 0, durSec: 5.8, note: 49.98, gain: 0.45 },
    { atSec: 0, durSec: 5.8, note: 57, gain: 0.4 },
    { atSec: 0.8, durSec: 5, note: 54.96, gain: 0.4 },
    { atSec: 0.8, durSec: 5, note: 61.98, gain: 0.4 },
    { atSec: 1.6, durSec: 4.2, note: 69, gain: 0.4 },
    { atSec: 1.6, durSec: 4.2, note: 76.02, gain: 0.35 },
  ],
}

// Harmonics of the cello's C string, partials 3 4 5 6, one over another on the string itself.
const PARTIALS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 35.94, gain: 0.45 },
    { atSec: 0.6, durSec: 5.6, note: 54.96, gain: 0.5 },
    { atSec: 1.4, durSec: 4.8, note: 59.94, gain: 0.5 },
    { atSec: 2.2, durSec: 4, note: 63.8, gain: 0.45 },
    { atSec: 3, durSec: 3.2, note: 66.96, gain: 0.45 },
  ],
}

// Each cello string and its third partial: the four twelfths are the violin's four open strings.
const TWELFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 35.94, gain: 0.5 },
    { atSec: 0.5, durSec: 1.4, note: 54.96, gain: 0.5 },
    { atSec: 1.6, durSec: 1.9, note: 42.96, gain: 0.5 },
    { atSec: 2.1, durSec: 1.4, note: 61.98, gain: 0.5 },
    { atSec: 3.2, durSec: 1.9, note: 49.98, gain: 0.5 },
    { atSec: 3.7, durSec: 1.4, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 1.6, note: 57, gain: 0.45 },
    { atSec: 5.3, durSec: 1.1, note: 76.02, gain: 0.45 },
  ],
}

// Ticks on the open A over a held G, 3 + 3 + 2 twice, the held G joined by its D.
const TICKS: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 42.96, gain: 0.4 },
    { atSec: 2.4, durSec: 3.4, note: 49.98, gain: 0.35 },
    ...[0.4, 1.3, 2.2, 2.8, 3.7, 4.6, 5.2].map((atSec, i) => ({
      atSec,
      durSec: 0.12,
      note: i % 3 === 2 ? 69 : 57,
      gain: 0.65,
    })),
  ],
}

// Plucked: cello, viola and violin each across four strings upwards, then one string from each.
const ROLLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 35.94, gain: 0.6 },
    { atSec: 0.3, durSec: 1.2, note: 42.96, gain: 0.55 },
    { atSec: 0.6, durSec: 1.2, note: 49.98, gain: 0.55 },
    { atSec: 0.9, durSec: 1.2, note: 57, gain: 0.55 },
    { atSec: 1.5, durSec: 1.2, note: 47.94, gain: 0.55 },
    { atSec: 1.8, durSec: 1.2, note: 54.96, gain: 0.5 },
    { atSec: 2.1, durSec: 1.2, note: 61.98, gain: 0.5 },
    { atSec: 2.4, durSec: 1.2, note: 69, gain: 0.5 },
    { atSec: 3, durSec: 1.2, note: 54.96, gain: 0.5 },
    { atSec: 3.3, durSec: 1.2, note: 61.98, gain: 0.5 },
    { atSec: 3.6, durSec: 1.2, note: 69, gain: 0.5 },
    { atSec: 3.9, durSec: 1.2, note: 76.02, gain: 0.5 },
    { atSec: 4.8, durSec: 1.4, note: 42.96, gain: 0.6 },
    { atSec: 4.8, durSec: 1.4, note: 61.98, gain: 0.5 },
    { atSec: 4.8, durSec: 1.4, note: 76.02, gain: 0.5 },
  ],
}

// Tuning up: the A alone and in octaves, then double stops, A E, D A, G D, C G.
const TUNING: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 69, gain: 0.5 },
    { atSec: 0.7, durSec: 1.6, note: 57, gain: 0.45 },
    { atSec: 1.6, durSec: 1.4, note: 76.02, gain: 0.4 },
    { atSec: 2.6, durSec: 1.5, note: 61.98, gain: 0.45 },
    { atSec: 2.8, durSec: 1.3, note: 69, gain: 0.45 },
    { atSec: 3.8, durSec: 1.4, note: 54.96, gain: 0.45 },
    { atSec: 4, durSec: 1.2, note: 61.98, gain: 0.45 },
    { atSec: 5, durSec: 1.5, note: 47.94, gain: 0.5 },
    { atSec: 5.1, durSec: 1.4, note: 54.96, gain: 0.5 },
  ],
}

// The comma: the E that is partial 5 of the viola's C, and the violin's open E a fifth of a semitone over it.
const COMMA: Phrase = {
  notes: [
    { atSec: 0, durSec: 6, note: 47.94, gain: 0.5 },
    { atSec: 0.4, durSec: 5.6, note: 54.96, gain: 0.45 },
    { atSec: 1.2, durSec: 3.4, note: 75.8, gain: 0.4 },
    { atSec: 2.6, durSec: 3.4, note: 76.02, gain: 0.4 },
  ],
}

// Four players, a string each: C G D A, then G G A E, D G A E, and C C G E, the nearest they come to a triad.
const CHORALE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 35.94, gain: 0.5 },
    { atSec: 0, durSec: 4.9, note: 54.96, gain: 0.45 },
    { atSec: 0, durSec: 1.7, note: 61.98, gain: 0.4 },
    { atSec: 0, durSec: 1.7, note: 69, gain: 0.4 },
    { atSec: 1.7, durSec: 1.6, note: 42.96, gain: 0.5 },
    { atSec: 1.7, durSec: 3.2, note: 69, gain: 0.4 },
    { atSec: 1.7, durSec: 4.9, note: 76.02, gain: 0.4 },
    { atSec: 3.3, durSec: 1.6, note: 49.98, gain: 0.45 },
    { atSec: 4.9, durSec: 1.7, note: 35.94, gain: 0.5 },
    { atSec: 4.9, durSec: 1.7, note: 47.94, gain: 0.45 },
    { atSec: 4.9, durSec: 1.7, note: 54.96, gain: 0.4 },
  ],
}

// The cello alone, one string at a time: up its fifths and back to C.
const CELLO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 35.94, gain: 0.55 },
    { atSec: 1.5, durSec: 1, note: 42.96, gain: 0.5 },
    { atSec: 2.5, durSec: 1, note: 49.98, gain: 0.5 },
    { atSec: 3.5, durSec: 1.2, note: 57, gain: 0.5 },
    { atSec: 4.7, durSec: 0.8, note: 49.98, gain: 0.45 },
    { atSec: 5.5, durSec: 1.2, note: 35.94, gain: 0.55 },
  ],
}

// The violin rocks across its strings over a low G: E A D A, E A G A, two bows of it, then D with A.
const BARIOLAGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.7, note: 42.96, gain: 0.35 },
    ...[76.02, 69, 61.98, 69, 76.02, 69, 54.96, 69].map((note, i) => ({
      atSec: i * 0.3,
      durSec: 0.34,
      note,
      gain: 0.5,
    })),
    ...[76.02, 69, 61.98, 69, 76.02, 69, 54.96].map((note, i) => ({
      atSec: 2.4 + i * 0.3,
      durSec: 0.34,
      note,
      gain: 0.45,
    })),
    { atSec: 4.5, durSec: 1.5, note: 61.98, gain: 0.5 },
    { atSec: 4.5, durSec: 1.5, note: 69, gain: 0.5 },
  ],
}

// The strings two players share, D, G and A: one bows, the other answers the same string a hair sharp.
const SHARED: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 61.98, gain: 0.45 },
    { atSec: 0.9, durSec: 2.6, note: 62.02, gain: 0.45 },
    { atSec: 2, durSec: 3, note: 54.96, gain: 0.45 },
    { atSec: 2.9, durSec: 3.1, note: 55, gain: 0.45 },
    { atSec: 3.6, durSec: 2.8, note: 69, gain: 0.4 },
    { atSec: 4.4, durSec: 2, note: 69.04, gain: 0.4 },
  ],
}

// Measured bows on D and A in fives, 3 + 2, with a long C and the violin's A round the second half.
const PULSE: Phrase = {
  notes: [
    ...Array.from({ length: 20 }, (_, i) => ({
      atSec: i * 0.28,
      durSec: 0.2,
      note: i % 5 === 0 || i % 5 === 3 ? 49.98 : 57,
      gain: i % 5 === 0 || i % 5 === 3 ? 0.65 : 0.45,
    })),
    { atSec: 2.8, durSec: 3.1, note: 35.94, gain: 0.4 },
    { atSec: 2.8, durSec: 3.1, note: 69, gain: 0.35 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Chamber strings, open: no mute, the bow in its usual place.
  {
    id: 'open-string-quartet-pegs-before-the-piece',
    name: 'Pegs before the piece',
    category: 'string',
    description:
      'Four players with no vibrato and no mute, close together in tuning, with hard separate echoes off an empty hall.',
    preview: TUNING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 4,
        attack: 0.3,
        release: 0.7,
        bow: 0.5,
        air: 0.2,
        vibrato: 0,
        mute: 0,
        scatter: 0.05,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { low: -2 } },
      { deviceId: 'expanse', preset: 'Hard echoes', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'open-string-quartet-one-desk-bare-boards',
    name: 'One desk, bare boards',
    category: 'string',
    description: 'A single quick bow in mono, rung through a wooden soundboard and a short spring.',
    preview: BARIOLAGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -4.5, attack: 0.08, release: 0.35, bow: 0.6, vibrato: 0, scatter: 0.1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.7, mix: 0.75 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'open-string-quartet-eight-seconds-of-c',
    name: 'Eight seconds of C',
    category: 'pad',
    description:
      'Six unmuted players who enter over two seconds and leave over five, in a wide ten second space.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 2, release: 5, bow: 0.45, air: 0.2, vibrato: 0, mute: 0, scatter: 0.3 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
    ],
  },
  {
    id: 'open-string-quartet-loose-hair',
    name: 'Loose hair',
    category: 'string',
    description:
      'Six players who scarcely agree on the pitch, all breath and slack bow, kept a few steps away on new tape.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { volume: -3.5, attack: 0.7, bow: 0.15, air: 1, vibrato: 0, mute: 0 },
    },
    effects: [
      { deviceId: 'patina', preset: 'New tape', params: { wobble: 0.3 } },
      { deviceId: 'distance', preset: 'A few steps back', params: { wander: 0.1 } },
    ],
  },
  {
    id: 'open-string-quartet-measured-in-fives',
    name: 'Measured in fives',
    category: 'string',
    description:
      'Short bows with a bite of pentode drive and a tight bright spring that rings on for six seconds.',
    preview: PULSE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { attack: 0.06, release: 0.25, bow: 0.65, vibrato: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'open-string-quartet-town-hall-low-sun',
    name: 'Town hall, low sun',
    category: 'string',
    description:
      'Five slow unmuted bows warmed in the lows and dulled on top, then set in a nave of eight seconds.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { attack: 0.9, release: 2, bow: 0.3, vibrato: 0, mute: 0, scatter: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3000 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'open-string-quartet-fifths-in-the-next-room',
    name: 'Fifths in the next room',
    category: 'string',
    description:
      'Four players heard from a loudspeaker down a corridor, rolled off under the bow noise.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { volume: -4, attack: 0.6, release: 1.4, vibrato: 0, mute: 0.1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { drive: 0.1 } },
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 1300, slope: 1 } },
    ],
  },
  {
    id: 'open-string-quartet-two-on-the-stairs',
    name: 'Two on the stairs',
    category: 'string',
    description:
      'Two unmuted players, small and narrow, far up a stone stairwell that rings for three and a half seconds.',
    preview: SHARED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -6, attack: 0.35, release: 1.2, bow: 0.4, vibrato: 0, mute: 0, width: 1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.75, width: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-spike-in-the-floor',
    name: 'Spike in the floor',
    category: 'bass',
    description:
      'Viol-like bows with an octave added under them, carried through a drum-like floor.',
    preview: CELLO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.15, release: 0.7, vibrato: 0, mute: 0.1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, filter: 800 } },
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 3, mix: 0.7 } },
    ],
  },
  {
    id: 'open-string-quartet-old-shellac-four',
    name: 'Old shellac four',
    category: 'string',
    description:
      'A still section of four on a worn record at 78, crackle and all, with a dark plate behind it.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { volume: -4, players: 4, attack: 0.3, release: 0.9, vibrato: 0 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'open-string-quartet-long-down-bow',
    name: 'Long down bow',
    category: 'pad',
    description:
      'Four bows drawn in over two and a half seconds, answered by a reverb that rises backwards behind it.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        volume: -2.5,
        players: 4,
        attack: 2.5,
        release: 3,
        bow: 0.55,
        air: 0.15,
        vibrato: 0,
        mute: 0,
      },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 0.5 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'open-string-quartet-half-a-beat-apart',
    name: 'Half a beat apart',
    category: 'string',
    description:
      'Each bow is thrown back on a ladder of eight echoes across the room, over a dark plate.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 2,
        attack: 0.25,
        release: 0.6,
        bow: 0.5,
        air: 0.1,
        vibrato: 0,
        mute: 0,
        width: 0.4,
      },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Bent ladder', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'open-string-quartet-the-a-goes-round',
    name: 'The A goes round',
    category: 'string',
    description:
      'One player whose note is taken up by two others, 0.9 seconds later each, at the same pitch and further out.',
    preview: TUNING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -3.5, attack: 0.3, release: 0.8, bow: 0.4, vibrato: 0, width: 0.2 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: {
          followers: 2,
          gap: 0.9,
          interval1: 0,
          interval2: 0,
          crab: 0,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'open-string-quartet-porch-in-march',
    name: 'Porch in March',
    category: 'pad',
    description:
      'Three wide bows thinned of their lows, in a cathedral tail, with a gust of wind crossing them.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { players: 3, attack: 1, release: 2, bow: 0.4, vibrato: 0, width: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 9000 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.5 } },
    ],
  },

  // Muted: the mute on the bridge, from half to all the way.
  {
    id: 'open-string-quartet-ebony-mutes',
    name: 'Ebony mutes',
    category: 'string',
    description:
      'Five fully muted players with a quick bow, everything over 1.2 kHz shaved away, on a small plate.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.35, release: 0.9, vibrato: 0, mute: 1, bow: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'open-string-quartet-mutes-after-supper',
    name: 'Mutes after supper',
    category: 'pad',
    description:
      'Six muted bows that swell for three seconds into a tail which sinks slowly as it rings.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 6, attack: 3, release: 5, vibrato: 0, bow: 0.1 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { direction: 1, mix: 0.5 } },
    ],
  },
  {
    id: 'open-string-quartet-hotel-practice',
    name: 'Hotel practice',
    category: 'string',
    description:
      'A lone player with the mute right down, drowned a little and narrowed, as if behind a pillow.',
    preview: BARIOLAGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.15, release: 0.4, bow: 0.2, air: 0.1, vibrato: 0, mute: 1 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0, waver: 0.15 } },
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { drive: 0 } },
    ],
  },
  {
    id: 'open-string-quartet-far-desk-muted',
    name: 'Far desk, muted',
    category: 'pad',
    description:
      'Muted bows near the bridge, thin and slow, as far off as the other shore of a lake.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { attack: 1, release: 3, vibrato: 0 },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore', params: { width: 0.1 } }],
  },
  {
    id: 'open-string-quartet-mutes-and-tide',
    name: 'Mutes and tide',
    category: 'pad',
    description: 'Muted players whose bands swell and drift apart like surf, in a dark hall.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 4, attack: 0.8, release: 2, vibrato: 0, mute: 0.9, bow: 0.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Breaking waves' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-mute-left-in-the-sun',
    name: 'Mute left in the sun',
    category: 'texture',
    description:
      'A muted duet whose tail softens, sags in pitch and darkens the longer it has rung.',
    preview: SHARED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -7, attack: 0.3, release: 1, vibrato: 0, mute: 0.9 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.6, hold: 4 } }],
  },
  {
    id: 'open-string-quartet-second-violins-late',
    name: 'Second violins late',
    category: 'string',
    description:
      'Half-muted players in a small wooden box, with a copy a few cents off and a few hundredths of a second late on each side.',
    preview: TUNING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: {
        volume: -4.5,
        players: 3,
        attack: 0.25,
        release: 0.6,
        bow: 0.5,
        vibrato: 0,
        mute: 0.6,
        scatter: 0.5,
        width: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Hint of wood',
        params: { size: 0.5, opening: 0.5, mix: 0.75 },
      },
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'open-string-quartet-cello-left-on-a-cassette',
    name: 'Cello left on a cassette',
    category: 'bass',
    description: 'A muted low bow on an old cassette with three-headed echoes following it.',
    preview: CELLO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -2, attack: 0.2, release: 0.8, bow: 0.45, vibrato: 0, mute: 0.8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { speed: 3 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-grey-sordino',
    name: 'Grey sordino',
    category: 'pad',
    description:
      'Muted strings smeared into a dark standing wash in which every bow change is lost.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -17.5, players: 5, attack: 0.6, release: 2, vibrato: 0 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.85 } }],
  },
  {
    id: 'open-string-quartet-mute-in-a-pocket',
    name: 'Mute in a pocket',
    category: 'string',
    description:
      'Muted bows with their quiet overtones turned up from inside, through a two spring tank.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.5, release: 1.2, vibrato: 0, mute: 1 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { amount: 1 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'open-string-quartet-muted-fives',
    name: 'Muted fives',
    category: 'string',
    description:
      'Short muted bows whose sound is gated by two soft patterns that drift apart in left and right.',
    preview: PULSE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: -3, attack: 0.08, release: 0.6, vibrato: 0, mute: 1, bow: 0.4 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Wide weave' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'open-string-quartet-cloth-over-the-bridge',
    name: 'Cloth over the bridge',
    category: 'string',
    description:
      'Muted strings heard from a cupboard, driven a little by the loudspeaker, over the low rumble of an empty room.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { players: 3, attack: 0.4, release: 0.8, vibrato: 0, mute: 1, bow: 0.6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard', params: { distance: 0.3 } },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },

  // At the bridge: a thin fundamental and all the glass above it.
  {
    id: 'open-string-quartet-ponticello-shiver',
    name: 'Ponticello shiver',
    category: 'string',
    description:
      'Three players hard by the bridge in a deep tremolo of nine a second that crosses sides, on a bright plate.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -1, attack: 0.25, release: 1, bow: 1, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Fast shudder',
        params: { rate: 9, depth: 0.95, phase: 150, drift: 0.4, smooth: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { lowCut: 180 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'open-string-quartet-frost-on-the-wound-g',
    name: 'Frost on the wound G',
    category: 'pad',
    description:
      'Bridge bows with each high partial flickering by itself in left and right, in a short bright chamber.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.8, release: 2.5, bow: 1, air: 0.55, vibrato: 0, width: 1 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { rate: 4 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'open-string-quartet-bow-on-the-windings',
    name: 'Bow on the windings',
    category: 'string',
    description:
      'Thin bridge bows with everything under 700 Hz cut away, splashing in a dripping spring.',
    preview: BARIOLAGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: {
        players: 2,
        attack: 0.08,
        release: 0.3,
        bow: 0.9,
        air: 0.3,
        vibrato: 0,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 700 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'open-string-quartet-partials-near-the-bridge',
    name: 'Partials near the bridge',
    category: 'string',
    description:
      'A bow by the bridge with a resonance that wanders slowly among the harmonics of C, 5 to 12.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { players: 4, attack: 0.5, release: 1.5, bow: 0.85, vibrato: 0 },
    },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Slow wander', params: { root: 0, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'open-string-quartet-wood-on-the-open-a',
    name: 'Wood on the open A',
    category: 'string',
    description:
      'Noisy ticks at the bridge that skip away closer and closer together, duller with each bounce, in a small room.',
    preview: TICKS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: {
        volume: -0.5,
        attack: 0.05,
        release: 0.12,
        bow: 0.95,
        air: 0.7,
        vibrato: 0,
        scatter: 0.3,
      },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'open-string-quartet-g-wire-rung',
    name: 'G wire rung',
    category: 'texture',
    description:
      'Bridge bows crossed with a tone on G and its fifth, so each fifth takes on sums and differences.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.6, release: 2, bow: 0.95, vibrato: 0, players: 2 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Glass bells', params: { root: 7, octave: 5, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'open-string-quartet-scrape-and-answer',
    name: 'Scrape and answer',
    category: 'texture',
    description:
      'Pressed, noisy bows by the bridge, each played back to itself in reverse with its lows gone.',
    preview: TUNING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: {
        volume: -2,
        players: 2,
        attack: 0.15,
        release: 0.4,
        bow: 1,
        air: 0.9,
        vibrato: 0,
        mute: 0,
        scatter: 0.6,
      },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Thin and airy', params: { mix: 0.5 } }],
  },
  {
    id: 'open-string-quartet-nasal-choir-of-four',
    name: 'Nasal choir of four',
    category: 'voice',
    description: 'Glassy bows that come back from the hall as a bright wordless choir on ee.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -3, players: 4, attack: 0.4, release: 1.2, bow: 0.75, vibrato: 0 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'High ee', params: { mix: 0.6 } }],
  },
  {
    id: 'open-string-quartet-rosin-falling-in-light',
    name: 'Rosin falling in light',
    category: 'texture',
    description:
      'Six ragged bows, full of air and bridge, with small sparks an octave and more up drifting off them.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 1.2, release: 2, bow: 0.85, air: 1, vibrato: 0, mute: 0 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Glitter', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 200 } },
    ],
  },
  {
    id: 'open-string-quartet-tin-mute-glare',
    name: 'Tin mute glare',
    category: 'string',
    description:
      'A half-muted bridge bow folded over by a saturator until it glares, with a long dark plate behind it.',
    preview: SHARED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: -3, players: 2, attack: 0.3, release: 1, bow: 1, vibrato: 0, mute: 0.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.8, mix: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-shards-at-the-frog',
    name: 'Shards at the frog',
    category: 'texture',
    description:
      'Short bridge bows broken into tiny grains an octave up that scatter across the room.',
    preview: PULSE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: -5, attack: 0.05, release: 0.2, bow: 1, vibrato: 0, players: 1 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Glass shards', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'open-string-quartet-apse-at-six-below',
    name: 'Apse at six below',
    category: 'pad',
    description: 'Close cold bridge bows with a tail that climbs two octaves each time round.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 1.5, release: 3, bow: 0.9, vibrato: 0, width: 0.4 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.5, shimmer: 0.45 } }],
  },

  // Over the fingerboard and flautando: bow near nothing, the air let in.
  {
    id: 'open-string-quartet-flautando-on-g',
    name: 'Flautando on G',
    category: 'string',
    description:
      'Four feather bows over the fingerboard, half breath, in a hall whose tail is mostly air.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.8, release: 1.5, bow: 0, air: 0.5, vibrato: 0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.4 } }],
  },
  {
    id: 'open-string-quartet-hair-barely-down',
    name: 'Hair barely down',
    category: 'texture',
    description:
      'All air and hardly a note, with a slow breath of noise going in and out over the bows.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 6, attack: 1.8, release: 2.5, bow: 0.05, air: 1, vibrato: 0 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Only the air' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 12000 } },
    ],
  },
  {
    id: 'open-string-quartet-end-of-the-board',
    name: 'End of the board',
    category: 'string',
    description:
      'Two soft players with the middle hollowed out, on a plate that rings a long time.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { volume: -3, players: 2, attack: 0.4, release: 1, bow: 0, air: 0.2, vibrato: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { body: -8 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'open-string-quartet-flute-tone-in-fifths',
    name: 'Flute tone in fifths',
    category: 'organ',
    description:
      'Feather bows with breathy flute pipes at its own pitch and an octave above, a fainter one below, in a hall.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { players: 4, attack: 0.5, release: 1, bow: 0, air: 0.4, vibrato: 0 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'open-string-quartet-tasto-in-the-barley',
    name: 'Tasto in the barley',
    category: 'texture',
    description:
      'Soft bows outdoors, clouds passing over them in quick light and shade from side to side.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { volume: -2, attack: 0.8, release: 2, bow: 0.08, air: 0.6, vibrato: 0, mute: 0 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Dappled shade' },
      { deviceId: 'distance', preset: 'Open air' },
    ],
  },
  {
    id: 'open-string-quartet-tilted-hair',
    name: 'Tilted hair',
    category: 'string',
    description:
      'A soft bow that opens its own low-pass filter as it swells and closes it as it lets go.',
    preview: CELLO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: {
        volume: -2.5,
        players: 3,
        attack: 0.6,
        release: 1.2,
        bow: 0.1,
        air: 0.3,
        vibrato: 0,
        width: 0.4,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 3 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-bow-over-fog',
    name: 'Bow over fog',
    category: 'pad',
    description:
      'Quick soft bows whose starts are blurred into each other with no tail left hanging.',
    preview: BARIOLAGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -3.5, attack: 0.1, release: 0.4, bow: 0, air: 0.5, vibrato: 0, mute: 0.1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'open-string-quartet-flautando-down-a-well',
    name: 'Flautando down a well',
    category: 'pad',
    description:
      'Breathy open strings over a swarm of long dark echoes with nothing left above 1.4 kHz.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 3, attack: 0.5, release: 1, bow: 0.1, air: 0.7, vibrato: 0, width: 0.2 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.65 } }],
  },
  {
    id: 'open-string-quartet-sixteen-soft-bows',
    name: 'Sixteen soft bows',
    category: 'pad',
    description:
      'Two players over the fingerboard made into a flock of sixteen that moves slowly round the listener.',
    preview: HINGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { attack: 0.7, release: 1.8, bow: 0.05, air: 0.3, vibrato: 0, mute: 0 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Slow drift', params: { birds: 16, range: 8, mix: 0.75 } },
    ],
  },
  {
    id: 'open-string-quartet-sul-tasto-after-midnight',
    name: 'Sul tasto after midnight',
    category: 'texture',
    description:
      'Soft bows on a night-time radio that fades and narrows, with static when the signal sinks.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { volume: -3, attack: 0.5, release: 1, bow: 0.1, vibrato: 0, mute: 0.1 },
    },
    effects: [{ deviceId: 'radio', preset: 'Night shortwave', params: { fading: 0.4 } }],
  },

  // Natural harmonics: the string touched at a half, a third, a quarter, and what rings along.
  {
    id: 'open-string-quartet-finger-at-the-halfway',
    name: 'Finger at the halfway',
    category: 'string',
    description:
      'The octave of each note sounds in place of it, the string itself only a trace, on a faint plate.',
    preview: TWELFTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { volume: -3.5, players: 2, attack: 0.2, release: 0.7, bow: 0.2, vibrato: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { dry: 0.12, up1: 1 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'open-string-quartet-finger-at-the-third',
    name: 'Finger at the third',
    category: 'string',
    description:
      'Each note answers with its twelfth, the third partial, drawn as one pipe over a quiet string, in a hall.',
    preview: CELLO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        volume: -1.5,
        players: 2,
        attack: 0.25,
        release: 0.8,
        bow: 0.3,
        vibrato: 0,
        mute: 0,
      },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Only the pipes',
        params: {
          speak: 200,
          sub: 0,
          unison: 0.2,
          fifth: 0,
          octave: 0,
          twelfth: 1,
          fifteenth: 0,
          chiff: 0.6,
          mix: 0.9,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'open-string-quartet-nodes-as-sines',
    name: 'Nodes as sines',
    category: 'pad',
    description:
      'The strongest partials followed by pure sines two octaves higher that linger after the bow has gone.',
    preview: TWELFTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.3, release: 0.8, bow: 0.3, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Two octaves up',
        params: { attack: 300, tone: 0.5, mix: 0.7 },
      },
    ],
  },
  {
    id: 'open-string-quartet-nothing-but-open-strings',
    name: 'Nothing but open strings',
    category: 'drone',
    description:
      'Breathy bows sifted so only C D E G A ring in any octave, and go on for nine seconds.',
    preview: STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.4, release: 1, bow: 0.5, air: 1, vibrato: 0 },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'Long glass', params: { root: 0, scale: 7, tune: -2 } },
    ],
  },
  {
    id: 'open-string-quartet-fifths-left-standing',
    name: 'Fifths left standing',
    category: 'drone',
    description:
      'Only G and D pass, in narrow bands that ring on, whatever string is bowed into them, wide even in the bass.',
    preview: TASTO,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: {
        volume: -3.5,
        attack: 0.1,
        release: 0.4,
        bow: 0.8,
        air: 0.6,
        vibrato: 0,
        scatter: 0.4,
      },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'Open fifths', params: { root: 7, ring: 5, mix: 0.8 } },
      { deviceId: 'spread', preset: 'Everything wide' },
    ],
  },
  {
    id: 'open-string-quartet-unbowed-strings-answer',
    name: 'Unbowed strings answer',
    category: 'string',
    description:
      'Short bows that set a bank of sixteen strings in C major ringing in sympathy for ten seconds.',
    preview: PULSE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: {
        volume: -3.5,
        attack: 0.07,
        release: 0.2,
        bow: 0.5,
        air: 0.2,
        vibrato: 0,
        mute: 0.3,
      },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { root: 0, mix: 0.7 } }],
  },
  {
    id: 'open-string-quartet-glass-rims-in-g',
    name: 'Glass rims in G',
    category: 'bell',
    description:
      'Soft bows over singing bowls tuned in fifths from G, with a slow beat in each bowl.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: {
        volume: -4.5,
        players: 2,
        attack: 0.3,
        release: 0.8,
        bow: 0.1,
        vibrato: 0,
        mute: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 7, register: 0.6, strike: 0.7, mix: 0.6 },
      },
    ],
  },
  {
    id: 'open-string-quartet-whistle-above-the-string',
    name: 'Whistle above the string',
    category: 'string',
    description:
      'A bow whose body is shrunk to a toy and whose fifth sounds beside it, high and narrow.',
    preview: SHARED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -5, players: 1, attack: 0.3, release: 0.9, bow: 0.6, vibrato: 0, width: 0 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box' },
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'open-string-quartet-the-c-string-unfolds',
    name: 'The C string unfolds',
    category: 'pad',
    description:
      'Each bow is split into bands that arrive one after another from low to high over more than two seconds.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { players: 3, attack: 0.2, release: 0.6, bow: 0.7, air: 0.1, vibrato: 0, mute: 0 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.65 } }],
  },
  {
    id: 'open-string-quartet-the-comma-beating',
    name: 'The comma beating',
    category: 'string',
    description:
      'A plain still bow, one player to a note and no spread in tuning, so fifths lie still and a comma beats, in a bright chamber.',
    preview: COMMA,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.3, release: 1, bow: 0.45, air: 0.05, vibrato: 0, scatter: 0, width: 0.6 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Bright chamber', params: { modDepth: 0, mix: 0.35 } },
    ],
  },
  {
    id: 'open-string-quartet-stiff-gut',
    name: 'Stiff gut',
    category: 'string',
    description:
      'Partials pulled a little wide of true, as on a thick gut string, in a small room.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.2, release: 0.8, vibrato: 0, mute: 0.2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.2, pivot: 130 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
    ],
  },
  {
    id: 'open-string-quartet-trembling-over-the-board',
    name: 'Trembling over the board',
    category: 'string',
    description:
      'Soft airy bows in a tremolo of seven and a half a second, left against right, in a dark hall.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: {
        volume: -2,
        players: 4,
        attack: 0.4,
        release: 1.2,
        bow: 0,
        air: 0.3,
        vibrato: 0,
        mute: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 7.5, depth: 0.9, phase: 180, drift: 0.3 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },

  // One bowed string, plucked: pizzicato from damped to ringing.
  {
    id: 'open-string-quartet-thumb-across-the-cello',
    name: 'Thumb across the cello',
    category: 'plucked',
    description:
      'A plucked string with a full wooden body, four seconds of ring, and a soundboard under it.',
    preview: ROLLS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { brightness: 0.4, decay: 4, position: 0.3, body: 0.9, vibrato: 0, detune: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.6, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'open-string-quartet-palm-on-the-string',
    name: 'Palm on the string',
    category: 'plucked',
    description:
      'A pluck stopped by the palm almost at once, sounding inside a clay pot with a slap of tape after it.',
    preview: PULSE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.35, decay: 1, release: 0.2, vibrato: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { size: 1 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'open-string-quartet-nail-on-the-open-a',
    name: 'Nail on the open A',
    category: 'plucked',
    description: 'A bright nail pluck close to the bridge, bouncing in a splashy spring.',
    preview: BARIOLAGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: {
        volume: -8.5,
        release: 1.5,
        brightness: 0.95,
        decay: 6,
        position: 0.03,
        body: 0.1,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.45 } }],
  },
  {
    id: 'open-string-quartet-pizzicato-unstopped',
    name: 'Pizzicato, unstopped',
    category: 'plucked',
    description:
      'Plucks that ring for twenty seconds against a string a few cents off, in a wide late space.',
    preview: ROLLS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { brightness: 0.5, decay: 20, release: 10, body: 0.6, vibrato: 0, detune: 9 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.4 } }],
  },
  {
    id: 'open-string-quartet-plucked-node',
    name: 'Plucked node',
    category: 'plucked',
    description:
      'A pluck in the middle of the string with its octave sounding over it, like a harmonic let go.',
    preview: TWELFTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: {
        volume: 0.5,
        brightness: 0.6,
        decay: 10,
        release: 4,
        position: 0.5,
        body: 0.2,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { dry: 0.4, up1: 0.8, detune: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'open-string-quartet-pluck-without-a-start',
    name: 'Pluck without a start',
    category: 'plucked',
    description:
      'A pluck faded in over most of a second, rising again in the bloom of the reverb behind it.',
    preview: HINGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: 2, attack: 0.8, vibrato: 0, detune: 3 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.6 } },
      { deviceId: 'glimmer', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'open-string-quartet-viola-on-the-knee',
    name: 'Viola on the knee',
    category: 'plucked',
    description: 'A pluck with its body made smaller, strummed into dark wavering echoes.',
    preview: ROLLS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: {
        volume: -2,
        brightness: 0.55,
        decay: 2,
        release: 0.5,
        position: 0.18,
        body: 1,
        vibrato: 0,
        detune: 6,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'open-string-quartet-snapped-to-the-board',
    name: 'Snapped to the board',
    category: 'plucked',
    description:
      'A hard bright pluck that dies in a second, driven through a loudspeaker on the edge and a short room.',
    preview: PULSE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: {
        brightness: 0.9,
        decay: 1,
        release: 0.3,
        position: 0.08,
        body: 0.5,
        vibrato: 0,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { drive: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'open-string-quartet-tick-over-a-held-g',
    name: 'Tick over a held G',
    category: 'plucked',
    description:
      'Short plucks whose echoes fall in an uneven scatter of seven, each from another side.',
    preview: TICKS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: {
        volume: 0.5,
        release: 0.4,
        brightness: 0.65,
        decay: 3,
        position: 0.15,
        body: 0.4,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.5 } }],
  },

  // One bowed string, bowed.
  {
    id: 'open-string-quartet-open-c-nothing-on-it',
    name: 'Open C, nothing on it',
    category: 'bass',
    description:
      'A bright firm bow with no vibrato on a full body, the room behind it letting in sound in slow waves.',
    preview: CELLO,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        volume: -5,
        attack: 0.15,
        release: 0.6,
        brightness: 0.75,
        position: 0.06,
        body: 1,
        vibrato: 0,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { breathDepth: 1, mix: 0.5 } },
    ],
  },
  {
    id: 'open-string-quartet-bow-leaned-on',
    name: 'Bow leaned on',
    category: 'string',
    description:
      'A heavy rasping bow near the bridge, dulled on top and moved to the back of a hall.',
    preview: TUNING,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.25, release: 0.8, brightness: 0.7, vibrato: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5500 } },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'open-string-quartet-flat-hair-long-string',
    name: 'Flat hair, long string',
    category: 'pad',
    description:
      'A light slow bow near the middle of the string in a huge space with no lows in its tail.',
    preview: TASTO,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 1, release: 2.5, vibrato: 0, detune: 0, body: 0.3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.5 } }],
  },
  {
    id: 'open-string-quartet-two-es-a-comma-apart',
    name: 'Two Es, a comma apart',
    category: 'string',
    description: 'A glassy light bow with twelve undamped strings in C major ringing behind it.',
    preview: COMMA,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { volume: -16, attack: 0.6, release: 2, vibrato: 0, detune: 0 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Open triad',
        params: { root: 0, strings: 8, decay: 8, mix: 0.5 },
      },
    ],
  },
  {
    id: 'open-string-quartet-whole-stand-of-cellos',
    name: 'Whole stand of cellos',
    category: 'pad',
    description:
      'A bowed string doubled 25 cents apart with a full body, its width opened towards the top, in a hall.',
    preview: STACK,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.7, release: 2, vibrato: 0 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-wolf-between-g-and-a',
    name: 'Wolf between G and A',
    category: 'string',
    description:
      'A pressed bow that feeds back on itself and blooms into an overtone on held notes.',
    preview: CHORALE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.4,
        release: 1,
        brightness: 0.55,
        position: 0.2,
        pressure: 0.8,
        vibrato: 0,
        detune: 4,
      },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'open-string-quartet-fiddle-kept-in-the-barn',
    name: 'Fiddle kept in the barn',
    category: 'string',
    description:
      'A quick bright bow with little body, heard off a dusty record with no bass in it.',
    preview: BARIOLAGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.06,
        release: 0.3,
        pressure: 0.6,
        brightness: 0.6,
        position: 0.1,
        body: 0.15,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dust and scratches' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 7000 } },
    ],
  },
  {
    id: 'open-string-quartet-sine-beneath-the-bow',
    name: 'Sine beneath the bow',
    category: 'drone',
    description:
      'A soft bow whose four strongest partials are doubled an octave down by slow low sines.',
    preview: TASTO,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: {
        volume: -13.5,
        attack: 0.5,
        release: 1.5,
        brightness: 0.45,
        pressure: 0.2,
        vibrato: 0,
      },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'open-string-quartet-bow-changes-in-fives',
    name: 'Bow changes in fives',
    category: 'string',
    description:
      'A firm quick bow whose middle band is pulsed five times a second, the left side first.',
    preview: HINGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: {
        attack: 0.3,
        release: 0.8,
        brightness: 0.75,
        pressure: 0.6,
        body: 0.6,
        vibrato: 0,
        detune: 8,
      },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Five, left first', params: { depth: 1 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'open-string-quartet-bowed-into-the-wind',
    name: 'Bowed into the wind',
    category: 'texture',
    description:
      'A thin bow, all bridge, out in gusts that take its level and its tone up and down.',
    preview: SHARED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: {
        attack: 0.5,
        release: 2,
        brightness: 1,
        position: 0.02,
        body: 0,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [{ deviceId: 'weather', preset: 'Gale' }],
  },

  // One bowed string, held by the sustainer: a bow that never turns round.
  {
    id: 'open-string-quartet-bow-that-never-turns',
    name: 'Bow that never turns',
    category: 'drone',
    description:
      'A pure even string held without end, its bands drifting slowly from side to side.',
    preview: STACK,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 1.5, release: 3, brightness: 0.25, vibrato: 0 },
    },
    effects: [
      { deviceId: 'currents', preset: 'One slow wheel', params: { rate: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-node-that-keeps-singing',
    name: 'Node that keeps singing',
    category: 'string',
    description:
      'A sustained string pressed up towards its octave, with quick glassy repeats in the octaves above.',
    preview: TWELFTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.5, release: 1.2, vibrato: 0, detune: 2 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.4 } }],
  },
  {
    id: 'open-string-quartet-fifths-left-to-drift',
    name: 'Fifths left to drift',
    category: 'pad',
    description:
      'Two strings 18 cents apart swelling over two seconds, thickened again by a slow hollow chorus.',
    preview: HINGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { attack: 2, release: 4, vibrato: 0, detune: 18 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'open-string-quartet-fan-from-the-top-string',
    name: 'Fan from the top string',
    category: 'pad',
    description:
      'A bright sustained string whose bands arrive one by one, the highest first, down to its root.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.4, release: 1, vibrato: 0, detune: 0 },
    },
    effects: [
      { deviceId: 'prism', preset: 'High to low', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'open-string-quartet-shudder-on-two-strings',
    name: 'Shudder on two strings',
    category: 'string',
    description:
      'A quick bright sustain with lows and highs trembling in turn, in an overdriven spring.',
    preview: CHORALE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { attack: 0.1, release: 0.5, vibrato: 0 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 6, depth: 1 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'open-string-quartet-the-beat-put-back',
    name: 'The beat put back',
    category: 'drone',
    description:
      'A pure sustained string with a copy moved up by a hertz or two, so unbeating fifths beat slowly again.',
    preview: HINGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: {
        attack: 0.6,
        release: 1.5,
        brightness: 0.6,
        position: 0.2,
        pressure: 0.3,
        body: 0.5,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { fine: 1.5 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.25 } },
    ],
  },

  // String machine: the quartet under two hands, with its octaves and its ensemble.
  {
    id: 'open-string-quartet-stack-with-all-octaves',
    name: 'Stack with all octaves',
    category: 'pad',
    description:
      'Three octaves of a string ensemble on each key, plain and wide, in an ordinary hall.',
    preview: STACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.4, release: 1.5, ensemble: 0.7, tone: 4000 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
  },
  {
    id: 'open-string-quartet-four-keys-no-chorus',
    name: 'Four keys, no chorus',
    category: 'string',
    description:
      'Plain unchorused saws given a body by a small soundboard, cut under 450 Hz, on a bright plate.',
    preview: BARIOLAGE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { volume: -3, attack: 0.05, release: 0.3, low: 0, high: 0.4, tone: 3000 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.6, mix: 0.85 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 450 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'open-string-quartet-cellos-only-please',
    name: 'Cellos only, please',
    category: 'bass',
    description:
      'An ensemble with a full octave under each key and a dark filter, pressed by iron in the lows.',
    preview: CELLO,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { volume: -4.5, attack: 0.25, release: 0.8, tone: 900, ensemble: 0.3, width: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'open-string-quartet-mutes-on-the-machine',
    name: 'Mutes on the machine',
    category: 'pad',
    description:
      'Violins with a full octave above and the top shut off, left to hang in a slow dark blur.',
    preview: TASTO,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { volume: -13.5, attack: 0.7, release: 1.5, tone: 1000 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } }],
  },
  {
    id: 'open-string-quartet-paper-bridge',
    name: 'Paper bridge',
    category: 'string',
    description:
      'Each key and the octave over it, brilliant and quick, the lows cut and lows and highs trembling in turn.',
    preview: HINGE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -2.5, attack: 0.2, release: 0.9, ensemble: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 300 } },
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { rate: 8, depth: 0.9 } },
    ],
  },
  {
    id: 'open-string-quartet-tasto-by-streetlamp',
    name: 'Tasto by streetlamp',
    category: 'pad',
    description:
      'A dark ensemble filtered down to 450 Hz, warmed by wavering valves and moved round the head.',
    preview: STACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 1, release: 2.5, low: 0.4 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'open-string-quartet-flageolets-in-glass',
    name: 'Flageolets in glass',
    category: 'pad',
    description:
      'A bright ensemble with a full octave above each key, its partials redrawn as clear sines.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { volume: -14.5, attack: 0.5, release: 1.5, ensemble: 0.3, tone: 9000 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Glass redraw', params: { mix: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'open-string-quartet-violas-counting-fives',
    name: 'Violas counting fives',
    category: 'string',
    description: 'Violas at pitch, quick and narrow, with short gated reverb behind each bow.',
    preview: PULSE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.06, release: 0.25, tone: 2400, ensemble: 0.4 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.5 } }],
  },
  {
    id: 'open-string-quartet-tuning-from-the-pit',
    name: 'Tuning from the pit',
    category: 'texture',
    description:
      'An out-of-tune, drifting ensemble through a horn on a station platform, a far rumble under it.',
    preview: TUNING,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.3, release: 0.8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform' },
      { deviceId: 'noise-floor', preset: 'Distant rumble' },
    ],
  },
  {
    id: 'open-string-quartet-a-string-calls-the-next',
    name: 'A string calls the next',
    category: 'organ',
    description:
      'A hollow ensemble with organ pipes a fifth and a twelfth over each note, so C sounds G, G sounds D, on a plate.',
    preview: CELLO,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { volume: 1.5, attack: 0.25, release: 1 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Hollow fifths', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'open-string-quartet-desks-going-home',
    name: 'Desks going home',
    category: 'pad',
    description:
      'A slow ensemble whose tail sinks by gliding voices an octave apart and never arrives.',
    preview: HINGE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { volume: -4.5, attack: 1.2, release: 2.5 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.5 } }],
  },
  {
    id: 'open-string-quartet-shared-a-through-a-horn',
    name: 'Shared A through a horn',
    category: 'organ',
    description:
      'An unchorused organ-like ensemble spun slowly in a rotating cabinet with a horn and a drum.',
    preview: SHARED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { attack: 0.15, release: 0.5, low: 0.5, high: 0.2, tone: 1800 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'open-string-quartet-low-string-after-four',
    name: 'Low string after four',
    category: 'bass',
    description:
      'A bowed bass ensemble swept very slowly by a six-stage phaser, with a short slap in the middle.',
    preview: CELLO,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { volume: 2.5, attack: 0.15, release: 0.6, tone: 700, low: 0.5, high: 0.2 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'open-string-quartet-backwards-through-fifths',
    name: 'Backwards through fifths',
    category: 'texture',
    description:
      'An ensemble whose every chord comes back in reverse and an octave up, again and again.',
    preview: TUNING,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { volume: -1.5, attack: 0.2, release: 0.6, low: 0.2, high: 0.2, ensemble: 0.6 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.5 } }],
  },
  {
    id: 'open-string-quartet-all-sixteen-strings',
    name: 'All sixteen strings',
    category: 'pad',
    description:
      'A wide ensemble on its slowest chorus, with an octave of dark shimmer sinking under it.',
    preview: STACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 1, release: 3 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.45 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
]
