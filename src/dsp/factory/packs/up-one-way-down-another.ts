import { type FactoryPreset, type Phrase } from '../types'

// Slow melodies that rise on one road and fall on another, over the sixteen maps
// of the maker. A hand holds one key, or asks again in a silence, or moves the
// resting note, and the line is written from that. Each take was chosen by
// reading what it writes: a phrase that rises, turns, falls and comes home.

/** One key held near the middle: a phrase or two, then home. */
const ONE_KEY: Phrase = { notes: [{ atSec: 0, durSec: 5.6, note: 62, gain: 0.7 }] }
/** The same a fourth lower, for maps that rest on A, F or E. */
const MID_KEY: Phrase = { notes: [{ atSec: 0, durSec: 5.6, note: 57, gain: 0.7 }] }
/** Low, for a line at the bottom of an instrument. */
const LOW_KEY: Phrase = { notes: [{ atSec: 0, durSec: 5.6, note: 50, gain: 0.7 }] }
/** High, for what rings. */
const HIGH_KEY: Phrase = { notes: [{ atSec: 0, durSec: 5.6, note: 69, gain: 0.65 }] }
/** One key let go a little sooner, for a melody in no hurry: its long phrase is brought home. */
const STILL_HELD: Phrase = { notes: [{ atSec: 0, durSec: 5.2, note: 62, gain: 0.7 }] }
/** A key held, and the fifth over it touched in the silence: the next phrase begins there and then. */
const ASKED_AGAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 62, gain: 0.7 },
    { atSec: 4.2, durSec: 0.4, note: 69, gain: 0.7 },
  ],
}
/** Two keys let go early: each phrase is brought home by itself. */
const LET_GO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.7 },
    { atSec: 4, durSec: 1.5, note: 60, gain: 0.6 },
  ],
}
/** A key, then one an octave under it: home is an octave lower, and the line goes down to it. */
const OCTAVE_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 69, gain: 0.7 },
    { atSec: 3.4, durSec: 2.4, note: 57, gain: 0.7 },
  ],
}
/** D, then A under it, where the lowest key held is the resting note. */
const FOURTH_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 62, gain: 0.7 },
    { atSec: 3.2, durSec: 2.6, note: 57, gain: 0.7 },
  ],
}
/** A, then D alone: the lower key is let go and the resting note goes up. */
const HOME_RISES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 57, gain: 0.7 },
    { atSec: 3.2, durSec: 2.6, note: 62, gain: 0.7 },
  ],
}
/** A key held, and one over it touched softly later: what follows is softer. */
const SOFTER_SECOND: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 57, gain: 0.8 },
    { atSec: 3.6, durSec: 0.4, note: 64, gain: 0.4 },
  ],
}
/** The other way: soft, then a key struck harder. */
const LOUDER_SECOND: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 57, gain: 0.45 },
    { atSec: 3.6, durSec: 0.4, note: 64, gain: 0.85 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'up-one-way-down-another-five-up-seven-down',
    name: 'Five up seven down',
    category: 'plucked',
    description:
      'A pedal steel climbs five notes of Bhimpalasi and falls through seven, over a plucked drone tuned to its fourth.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Afternoon longing',
      params: {
        pace: 0.42,
        phrase: 3.6,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 8,
        zigzag: 0.8,
        drone: 0.45,
        seed: 18,
      },
      parts: {
        drone: { deviceId: 'tanpura', preset: 'Ma tuning', params: { speed: 3, volume: -16 } },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.12, volume: -9 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.18 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-lamps-along-the-verge',
    name: 'Lamps along the verge',
    category: 'plucked',
    description:
      'A bright picked steel on the Yaman map, its raised fourth kept in both ways, the fifth heard only coming down.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'First lamps',
      params: {
        pace: 0.36,
        phrase: 4,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        range: 9,
        drone: 0,
        seed: 19,
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { tone: 4800, volume: -5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-lament-at-the-far-gate',
    name: 'Lament at the far gate',
    category: 'plucked',
    description:
      'A dark swelled steel in a five-note mode, a turn in every falling fourth, over soft ensemble cellos.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Lament',
      params: { pace: 0.5, phrase: 4, rest: 1.2, grow: 0, tail: 1.6, drone: 0.4, seed: 59 },
      parts: {
        drone: {
          deviceId: 'string-machine',
          preset: 'Cellos',
          params: { attack: 0.3, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { swell: 0.22, sustain: 10, volume: -2 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { mix: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'up-one-way-down-another-harbour-steps',
    name: 'Harbour steps',
    category: 'plucked',
    description:
      'A twanged short steel walks a five-note air in quick phrases, its own drone under it, tape slap and springs behind.',
    preview: ASKED_AGAIN,
    maker: {
      makerId: 'two-roads',
      preset: 'Harbour air',
      params: { pace: 0.32, phrase: 3.2, rest: 2.4, grow: 0, tail: 1.6, drone: 0.3, seed: 39 },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { sustain: 3, tone: 5200, volume: -9 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-sharpened-on-the-climb',
    name: 'Sharpened on the climb',
    category: 'plucked',
    description:
      'A singing steel in melodic minor, sixth and seventh raised only going up, over two held reed notes.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: {
        pace: 0.38,
        phrase: 4,
        rest: 1,
        grow: 0,
        tail: 1.6,
        dwell: 0.3,
        drone: 0.4,
        seed: 51,
      },
      parts: {
        drone: {
          deviceId: 'organ',
          preset: 'Shruti box',
          params: { attack: 0.3, release: 1, volume: -21 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.18, vibrato: 16, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-caravan-at-the-ford',
    name: 'Caravan at the ford',
    category: 'plucked',
    description:
      'A sliding steel on the Hijaz path in phrases of about nine seconds, four of silence, over a wide slow drone.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Far caravan',
      params: { pace: 0.8, phrase: 9, rest: 4, grow: 0, drone: 0.45, seed: 26, tail: 2.3 },
      parts: {
        drone: {
          deviceId: 'tanpura',
          preset: 'Slow wall',
          params: { tuning: 1, speed: 5, volume: -8.5 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.25, range: 7, volume: -4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back' },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-cold-water-landing',
    name: 'Cold water landing',
    category: 'plucked',
    description:
      'A glassy steel swells into each note of a gapped mode with no drone; a faint octave hangs in its tail.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Cold loch',
      params: {
        pace: 0.5,
        phrase: 4.4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 8,
        zigzag: 0.4,
        drone: 0,
        seed: 45,
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 0.35, sustain: 12, volume: -6 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-between-the-tall-stones',
    name: 'Between the tall stones',
    category: 'pad',
    description:
      'A long steel swell on a gapped mode, phrases near twelve seconds and five of rest, over a rubbed bowl.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Standing stones',
      params: { pace: 1.3, phrase: 12, rest: 5, range: 6, drone: 0.5, seed: 30, tail: 2.3 },
      parts: { drone: { deviceId: 'modal-bells', preset: 'Rubbed bowl', params: { volume: -22 } } },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 0.7, sustain: 20, volume: -6 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-letter-kept-in-a-drawer',
    name: 'Letter kept in a drawer',
    category: 'plucked',
    description:
      'A soft bending steel on the Nahawand map alone, its seventh sharp going up, worn a little by tape and a combo amplifier.',
    preview: SOFTER_SECOND,
    maker: {
      makerId: 'two-roads',
      preset: 'Letter home',
      params: {
        pace: 0.42,
        phrase: 3.8,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        range: 8,
        drone: 0,
        seed: 2,
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { swell: 0.08, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'up-one-way-down-another-past-the-last-inn',
    name: 'Past the last inn',
    category: 'plucked',
    description:
      'A round steel struck by the thumb on Bageshri, the fifth only touched in passing, over two dark sines.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Past midnight',
      params: {
        pace: 0.44,
        phrase: 4.2,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 8,
        dwell: 0.3,
        drone: 0.5,
        seed: 37,
      },
      parts: {
        drone: {
          deviceId: 'dusk',
          preset: 'Round sine',
          params: { attack: 0.2, release: 1, volume: -18.5 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 7, volume: 2.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-white-road-at-noon',
    name: 'White road at noon',
    category: 'plucked',
    description:
      'A quick lap steel on the Rast map with no drone, the seventh natural going up and flat coming down.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Straight road',
      params: { pace: 0.26, phrase: 3.2, rest: 0.8, grow: 0, tail: 1.6, drone: 0, seed: 1 },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { range: 2, sustain: 5, volume: -9 },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-crooked-orchard-path',
    name: 'Crooked orchard path',
    category: 'plucked',
    description:
      'A shaking bright steel on Rageshri, nearly every falling fourth turned back on, over a low hand-struck bowl of steel.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Sixths and fourths',
      params: {
        pace: 0.36,
        phrase: 3.8,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 6,
        zigzag: 0.95,
        drone: 0.6,
        seed: 51,
      },
      parts: { drone: { deviceId: 'handpan', preset: 'Low ding', params: { volume: -4 } } },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { vibrato: 22, sustain: 8, volume: -5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.4, mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-garden-after-eleven',
    name: 'Garden after eleven',
    category: 'plucked',
    description:
      'A fading steel on Bihag, second and sixth only touched on the way down, scattered points of echo behind it.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Night garden',
      params: { pace: 0.34, phrase: 4, rest: 1, grow: 0, tail: 1.6, drone: 0.35, seed: 39 },
      parts: { drone: { deviceId: 'organ', preset: 'Chapel flutes', params: { volume: -17.5 } } },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.12, volume: -6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-late-by-the-old-well',
    name: 'Late by the old well',
    category: 'plucked',
    description:
      'A blooming short steel on Asavari with turns in its falls, over the hum of a wind harp, a dark echo after.',
    preview: LET_GO,
    maker: {
      makerId: 'two-roads',
      preset: 'Late morning',
      params: { pace: 0.42, phrase: 4, rest: 1, grow: 0, tail: 2, range: 8, drone: 0.4, seed: 59 },
      parts: {
        drone: { deviceId: 'wind-harp', preset: 'Low hum', params: { release: 1.5, volume: -14 } },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short bloom',
      params: { swell: 0.1, sustain: 3, volume: -3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-sixth-and-seventh-change',
    name: 'Sixth and seventh change',
    category: 'plucked',
    description:
      'A clean neck pickup in melodic minor over a drone of its own, the sixth and seventh sharp up and natural down.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: {
        pace: 0.34,
        phrase: 4,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        dwell: 0.25,
        drone: 0.4,
        seed: 58,
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { strum: 0, sustain: 6, volume: 5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-everything-falls-home',
    name: 'Everything falls home',
    category: 'plucked',
    description:
      'A swelled guitar in a minor gapped mode with no drone, every falling fourth turned back once, a long dark echo behind.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Lament',
      params: {
        pace: 0.5,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        zigzag: 1,
        range: 7,
        drone: 0,
        seed: 25,
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 0.28, sustain: 10, volume: 6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'up-one-way-down-another-short-sleeves-on-a-quay',
    name: 'Short sleeves on a quay',
    category: 'plucked',
    description:
      'Muted guitar pattern notes in a five-note air at a quick walk, over two soft marimba notes a phrase.',
    preview: LET_GO,
    maker: {
      makerId: 'two-roads',
      preset: 'Harbour air',
      params: { pace: 0.28, phrase: 3, rest: 0.8, grow: 0, tail: 1.8, drone: 0.6, seed: 34 },
      parts: { drone: { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: -15.5 } } },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { hardness: 0.12, warmth: 0.6, sustain: 3, volume: 4 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 26, outputGain: -7.5 } },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-courthouse-staircase',
    name: 'Courthouse staircase',
    category: 'plucked',
    description:
      'A clean bell-like guitar on Nahawand over two long bass strings, a shallow tremolo in a tight chamber.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Letter home',
      params: {
        pace: 0.38,
        phrase: 4,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 9,
        drone: 0.5,
        seed: 27,
      },
      parts: {
        drone: { deviceId: 'string-bass', preset: 'Long wooden ring', params: { volume: -7.5 } },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: { strum: 0, sustain: 7, volume: 4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-grey-before-the-birds',
    name: 'Grey before the birds',
    category: 'pad',
    description:
      'A slow warm guitar swell on Bilaskhani, phrases near eleven seconds with four of silence, over low chanting voices.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Grey morning',
      params: { pace: 1.1, phrase: 11, rest: 4, grow: 0, drone: 0.4, seed: 21, tail: 2.3 },
      parts: {
        drone: {
          deviceId: 'choir',
          preset: 'Low monks',
          params: { attack: 0.4, release: 1.5, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { swell: 0.55, sustain: 16, volume: 4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-running-under-the-lamps',
    name: 'Running under the lamps',
    category: 'plucked',
    description:
      'A bright guitar runs the Yaman map four notes a second, up and back over a wide range; one faint canon follows.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Running water',
      params: { pace: 0.25, phrase: 4, rest: 0.9, tail: 1.9, range: 11, drone: 0, seed: 8 },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Harp roll',
      params: { strum: 0, sustain: 8, volume: -4 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-wall-in-the-late-sun',
    name: 'Wall in the late sun',
    category: 'plucked',
    description:
      'Thumbed neck guitar on Asavari, two notes of the fall left out on the climb, over a dry low drone of strings.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Late morning',
      params: {
        pace: 0.44,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 8,
        drone: 0.5,
        seed: 46,
      },
      parts: {
        drone: { deviceId: 'tanpura', preset: 'Closed jawari', params: { speed: 3, volume: -11 } },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Thumb and neck', params: { strum: 0, volume: 3 } },
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-one-stone-then-the-next',
    name: 'One stone then the next',
    category: 'bass',
    description:
      'A dark baritone guitar steps a gapped mode low on the neck, straight up and straight down, with no drone.',
    preview: LOW_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Standing stones',
      params: {
        pace: 0.46,
        phrase: 4.4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 8,
        dwell: 0.3,
        drone: 0,
        seed: 39,
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Dark baritone', params: { strum: 0, volume: 2.5 } },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.22, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-reeds-at-low-water',
    name: 'Reeds at low water',
    category: 'plucked',
    description:
      'Doubled strings in a gapped mode, the third touched only on the way down, moving slowly from side to side.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Cold loch',
      params: {
        pace: 0.46,
        phrase: 4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0,
        seed: 11,
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Twelve string', params: { strum: 0, volume: 2 } },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-second-step-of-the-court',
    name: 'Second step of the court',
    category: 'plucked',
    description:
      'A softly picked bridge guitar on Bayati, its second natural going up and flat coming down, over a low reed.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Courtyard',
      params: {
        pace: 0.34,
        phrase: 3.8,
        rest: 1,
        grow: 0,
        tail: 1.6,
        dwell: 0.3,
        drone: 0.4,
        seed: 26,
      },
      parts: {
        drone: { deviceId: 'clarinet', preset: 'Reed hum', params: { attack: 0.2, volume: -25 } },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { tone: 3800, hardness: 0.2, position: 0.1, warmth: 0.5, sustain: 10, volume: -3.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 26, outputGain: -10 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-straight-past-the-gate',
    name: 'Straight past the gate',
    category: 'plucked',
    description:
      'A dry unrolled guitar takes the Rast map at a run with no turns and no drone, over strings that ring in C.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Straight road',
      params: {
        pace: 0.24,
        phrase: 3.2,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        range: 10,
        zigzag: 0,
        drone: 0,
        seed: 26,
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Dry rolled chord',
      params: { strum: 0, sustain: 3, volume: -2 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { root: 0, mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-wall-of-the-night-garden',
    name: 'Wall of the night garden',
    category: 'plucked',
    description:
      'An overdriven warm guitar on Bihag with a drone on its own strings, through a slowly turning cabinet.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Night garden',
      params: {
        pace: 0.4,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.3,
        seed: 23,
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Warm breakup', params: { strum: 0, volume: -5.5 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-middle-of-the-afternoon',
    name: 'Middle of the afternoon',
    category: 'plucked',
    description:
      'A guitar with its pick hidden on Bhimpalasi over a soft harmonium, with a faint backward echo.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Afternoon longing',
      params: {
        pace: 0.45,
        phrase: 4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.35,
        seed: 22,
      },
      parts: { drone: { deviceId: 'organ', preset: 'Harmonium', params: { volume: -24.5 } } },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: { swell: 0.12, strum: 0, sustain: 8, volume: 6 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.22 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-only-the-white-ones',
    name: 'Only the white ones',
    category: 'plucked',
    description:
      'Damped neck guitar in melodic minor kept inside the key: no sixth or seventh going up, all seven coming down.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Inside the key',
      params: {
        pace: 0.4,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 8,
        drone: 0.35,
        seed: 51,
      },
      parts: {
        drone: {
          deviceId: 'dusk',
          preset: 'Dimming strings',
          params: { attack: 0.2, release: 1, volume: -8 },
        },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Dark stops', params: { sustain: 2.4, volume: 3 } },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'up-one-way-down-another-throat-after-midnight',
    name: 'Throat after midnight',
    category: 'voice',
    description:
      'A throat voice with one fixed whistle walks Bageshri over a drone in the same throat, in a close room.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Past midnight',
      params: {
        pace: 0.48,
        phrase: 3.8,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.35,
        seed: 11,
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: { wander: 0, release: 0.7, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-stones-that-hum',
    name: 'Stones that hum',
    category: 'voice',
    description:
      'A deep chant on a gapped mode, phrases of about fourteen seconds and six of silence, its tail shaped like sung vowels.',
    preview: LOW_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Standing stones',
      params: { pace: 1.5, phrase: 14, rest: 6, range: 5, drone: 0, seed: 58, tail: 1.9 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: { wander: 0, attack: 0.4, release: 1.5, growl: 0.3, volume: -9 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-grey-in-the-throat',
    name: 'Grey in the throat',
    category: 'voice',
    description:
      'A breathy pipe voice on Bilaskhani over distant organ pipes, set a few paces across the room.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Grey morning',
      params: {
        pace: 0.36,
        phrase: 4.4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.4,
        seed: 18,
      },
      parts: {
        drone: {
          deviceId: 'organ',
          preset: 'Distant pipes',
          params: { attack: 0.4, release: 1.2, volume: -22.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { wander: 0, attack: 0.1, release: 0.7, volume: -9 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room' },
      { deviceId: 'lift', preset: 'Just the ends' },
    ],
  },
  {
    id: 'up-one-way-down-another-whistle-down-the-glen',
    name: 'Whistle down the glen',
    category: 'voice',
    description:
      'A pipe voice whistling its tenth harmonic on a gapped mode, over a wind harp in still air.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Cold loch',
      params: {
        pace: 0.46,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.4,
        seed: 9,
      },
      parts: {
        drone: {
          deviceId: 'wind-harp',
          preset: 'Still air',
          params: { release: 1.2, volume: -15.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: { overtone: 10, wander: 0, attack: 0.06, release: 0.6, volume: -10 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } }],
  },
  {
    id: 'up-one-way-down-another-dry-reed-at-the-well',
    name: 'Dry reed at the well',
    category: 'voice',
    description:
      'A buzzing reed voice alone on Asavari, through a bedside speaker and a touch of spring.',
    preview: ASKED_AGAIN,
    maker: {
      makerId: 'two-roads',
      preset: 'Late morning',
      params: {
        pace: 0.36,
        phrase: 3.4,
        rest: 2.4,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0,
        seed: 23,
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { wander: 0, attack: 0.05, release: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { mix: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'up-one-way-down-another-two-kinds-of-second',
    name: 'Two kinds of second',
    category: 'plucked',
    description:
      'A twanged reed on the Bayati path, the second flat only coming down, over a quick dry drone tuned to the fourth.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Courtyard',
      params: {
        pace: 0.38,
        phrase: 3.8,
        rest: 1,
        grow: 0,
        tail: 1.6,
        dwell: 0.3,
        range: 7,
        drone: 0.5,
        seed: 34,
      },
      parts: {
        drone: {
          deviceId: 'tanpura',
          preset: 'Quick dry round',
          params: { tuning: 1, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { wander: 0.2, overtone: 6, release: 0.5, volume: -9 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.2 } }],
  },
  {
    id: 'up-one-way-down-another-fourth-raised-both-ways',
    name: 'Fourth raised both ways',
    category: 'voice',
    description:
      'A glassy high harmonic over each note of Yaman, the fifth kept for the fall, over two drones of pure slow-beating tones.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'First lamps',
      params: { pace: 0.38, phrase: 4, rest: 1, grow: 0, tail: 1.6, range: 8, drone: 0.4, seed: 6 },
      parts: {
        drone: {
          deviceId: 'still-point',
          preset: 'Soft bloom',
          params: { attack: 0.4, release: 1.2, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { attack: 0.1, release: 1, volume: -9 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'up-one-way-down-another-vowels-before-evening',
    name: 'Vowels before evening',
    category: 'voice',
    description:
      'Open vowels on Bhimpalasi over a humming choir, thickened by three voices in a warm hall.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Afternoon longing',
      params: {
        pace: 0.5,
        phrase: 4.2,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.4,
        seed: 49,
      },
      parts: {
        drone: {
          deviceId: 'choir',
          preset: 'Humming',
          params: { attack: 0.3, release: 1, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { wander: 0.3, attack: 0.1, release: 0.7, volume: -3.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-ember-track',
    name: 'Ember track',
    category: 'voice',
    description:
      'A growling low voice on the Hijaz path with no drone, gently saturated, in a small room.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Far caravan',
      params: {
        pace: 0.5,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 7,
        dwell: 0.3,
        drone: 0,
        seed: 19,
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { wander: 0, growl: 0.45, attack: 0.06, release: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-wherever-the-voice-rests',
    name: 'Wherever the voice rests',
    category: 'voice',
    description:
      'A still whistle in a minor gapped mode that rests on the lowest key held: a lower key takes the tune down to it.',
    preview: FOURTH_DOWN,
    maker: {
      makerId: 'two-roads',
      preset: 'Wherever you are',
      params: { pace: 0.4, phrase: 3.8, rest: 0.8, tail: 1.9, range: 7, drone: 0, seed: 59 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { attack: 0.1, release: 0.8, volume: -9 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Nearly still' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'up-one-way-down-another-pipe-on-a-straight-road',
    name: 'Pipe on a straight road',
    category: 'wind',
    description:
      'A pipe voice on Rast kept to the white keys, seven notes up and six down, over its own drone inside a length of pipe.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Straight road',
      params: {
        pace: 0.36,
        phrase: 3.8,
        rest: 1,
        grow: 0,
        tail: 1.6,
        tonic: 3,
        range: 7,
        drone: 0.3,
        seed: 26,
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { wander: 0, attack: 0.08, release: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-lip-of-the-harbour',
    name: 'Lip of the harbour',
    category: 'voice',
    description:
      'A buzzing lip voice on a five-note air, struck steel under each phrase, in the far motion of a turning horn.',
    preview: LET_GO,
    maker: {
      makerId: 'two-roads',
      preset: 'Harbour air',
      params: {
        pace: 0.34,
        phrase: 3,
        rest: 0.9,
        grow: 0,
        tail: 1.8,
        range: 7,
        drone: 0.6,
        seed: 21,
      },
      parts: { drone: { deviceId: 'handpan', preset: 'Halo', params: { volume: -2.5 } } },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { growl: 0.35, attack: 0.05, release: 0.4, volume: -4.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Far shimmer', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-red-gate-two-leaves',
    name: 'Red gate, two leaves',
    category: 'plucked',
    description:
      'A plucked string on the Hijaz path, its sixth higher going up than coming down, over a round of low strings.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Far caravan',
      params: {
        pace: 0.34,
        phrase: 3.8,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 8,
        dwell: 0.3,
        drone: 0.5,
        seed: 26,
      },
      parts: {
        drone: {
          deviceId: 'tanpura',
          preset: 'Morning raga',
          params: { tuning: 1, speed: 3, volume: -12 },
        },
      },
    },
    instrument: { deviceId: 'graft', preset: 'Plucked string', params: { volume: -1.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } }],
  },
  {
    id: 'up-one-way-down-another-natural-up-flat-down',
    name: 'Natural up, flat down',
    category: 'wind',
    description:
      'A blown pipe on the Bayati path over two held reed notes, its longest notes swaying late.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Courtyard',
      params: {
        pace: 0.44,
        phrase: 4.2,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.35,
        seed: 24,
      },
      parts: {
        drone: {
          deviceId: 'organ',
          preset: 'Shruti box',
          params: { attack: 0.3, release: 1, volume: -21.5 },
        },
      },
    },
    instrument: { deviceId: 'graft', preset: 'Blown pipe', params: { volume: -5 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { mix: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-sixths-across-a-stream',
    name: 'Sixths across a stream',
    category: 'plucked',
    description:
      'A struck wooden bar on Rageshri over humming low bars, each stroke faintly skipping off like a pebble.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Sixths and fourths',
      params: {
        pace: 0.3,
        phrase: 3.6,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.6,
        seed: 58,
      },
      parts: { drone: { deviceId: 'mallets', preset: 'Humming marimba', params: { volume: -12 } } },
    },
    instrument: { deviceId: 'graft', preset: 'Struck wood bar', params: { volume: -0.5 } },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Nearly dry' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.22, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-glass-among-the-roses',
    name: 'Glass among the roses',
    category: 'bell',
    description:
      'A struck bowl kept short on Bihag, second and sixth touched only in falling, its partials glinting one by one.',
    preview: HIGH_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Night garden',
      params: { pace: 0.46, phrase: 4, rest: 1.2, grow: 0, tail: 1.6, range: 6, drone: 0, seed: 8 },
    },
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: { decay: 4, release: 1.2, bright: 0.6, volume: -1.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen' },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'up-one-way-down-another-cold-pipe-before-five',
    name: 'Cold pipe before five',
    category: 'wind',
    description:
      'A bowed pipe on Bilaskhani, phrases near eleven seconds and four of silence, over a hollow hum.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Grey morning',
      params: { pace: 1, phrase: 11, rest: 4, grow: 0, range: 6, drone: 0.5, seed: 12, tail: 2.3 },
      parts: {
        drone: {
          deviceId: 'atmosphere',
          preset: 'Hollow drone',
          params: { attack: 0.6, release: 2, volume: -19 },
        },
      },
    },
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: { swell: 0.2, release: 0.8, volume: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'up-one-way-down-another-first-lamp-lit-on-metal',
    name: 'First lamp lit on metal',
    category: 'bell',
    description:
      'A bowed bowl speaks slowly through the Yaman map over two struck singing bowls, its top spread wide.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'First lamps',
      params: {
        pace: 0.46,
        phrase: 4.6,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 8,
        dwell: 0.3,
        drone: 0.5,
        seed: 13,
      },
      parts: {
        drone: {
          deviceId: 'modal-bells',
          preset: 'Singing bowl',
          params: { decay: 6, volume: 3.5 },
        },
      },
    },
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: { swell: 0.22, release: 1.6, volume: -0.5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy' },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-letter-read-twice',
    name: 'Letter read twice',
    category: 'string',
    description:
      'A bowed string on Nahawand plays loud and then soft over a small consort of viols, taped warm.',
    preview: SOFTER_SECOND,
    maker: {
      makerId: 'two-roads',
      preset: 'Letter home',
      params: {
        pace: 0.42,
        phrase: 3.8,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        range: 8,
        drone: 0.4,
        seed: 58,
      },
      parts: {
        drone: {
          deviceId: 'chamber-strings',
          preset: 'Viol consort',
          params: { attack: 0.15, release: 0.8, volume: -8 },
        },
      },
    },
    instrument: { deviceId: 'graft', preset: 'Bowed string', params: { volume: -4 } },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-the-other-staircase',
    name: 'The other staircase',
    category: 'plucked',
    description:
      'A struck string in melodic minor, sharp on the stairs up and natural on the stairs down, over its own fifth.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: {
        pace: 0.28,
        phrase: 3.8,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        dwell: 0.2,
        range: 10,
        drone: 0.4,
        seed: 38,
      },
    },
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: { decay: 3.5, release: 0.8, volume: -1 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'up-one-way-down-another-rope-down-the-well',
    name: 'Rope down the well',
    category: 'plucked',
    description:
      'A plucked stopped pipe alone on Asavari, hollow as a clay pot, its faint dulled echoes a step behind.',
    preview: ASKED_AGAIN,
    maker: {
      makerId: 'two-roads',
      preset: 'Late morning',
      params: {
        pace: 0.36,
        phrase: 3.4,
        rest: 2.6,
        grow: 0,
        tail: 1.6,
        range: 8,
        drone: 0,
        seed: 14,
      },
    },
    instrument: { deviceId: 'graft', preset: 'Plucked pipe', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-breath-over-the-cairn',
    name: 'Breath over the cairn',
    category: 'wind',
    description:
      'A blown bowl on a gapped mode, straight up and straight down, its tail glowing faintly an octave higher.',
    preview: HIGH_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Standing stones',
      params: {
        pace: 0.46,
        phrase: 4.4,
        rest: 1.3,
        grow: 0,
        tail: 1.6,
        range: 7,
        dwell: 0.3,
        drone: 0,
        seed: 23,
      },
    },
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: { swell: 0.2, release: 1.4, volume: -0.5 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { interval: 1, mix: 0.28 } },
    ],
  },
  {
    id: 'up-one-way-down-another-blown-along-the-shore',
    name: 'Blown along the shore',
    category: 'wind',
    description:
      'A blown string on a gapped mode over a soft stopped pipe, heard out of doors from a little way off.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Cold loch',
      params: {
        pace: 0.5,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.4,
        seed: 24,
      },
      parts: {
        drone: {
          deviceId: 'dusk',
          preset: 'Stopped pipe',
          params: { attack: 0.2, release: 1, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: { swell: 0.06, release: 0.7, volume: -5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'up-one-way-down-another-only-touched-in-passing',
    name: 'Only touched in passing',
    category: 'bell',
    description:
      'A bowed bar on Bageshri, its fifth a short grace on the way down, over a low bowl struck with each phrase.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Past midnight',
      params: {
        pace: 0.5,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.45,
        seed: 18,
      },
      parts: { drone: { deviceId: 'fm-glass', preset: 'Temple bowl', params: { volume: -19 } } },
    },
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: { swell: 0.12, release: 1, volume: -4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-letter-with-a-turn-in-it',
    name: 'Letter with a turn in it',
    category: 'plucked',
    description:
      'A fingered steel guitar on Nahawand, every falling fourth turned back on itself, over its own low fifth.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Letter home',
      params: {
        pace: 0.36,
        phrase: 4,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 8,
        zigzag: 1,
        drone: 0.45,
        seed: 10,
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { strum: 0, release: 0.8, volume: -1 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-noon-with-no-shadow',
    name: 'Noon with no shadow',
    category: 'plucked',
    description:
      'A bare bright string runs the Rast map with no drone, its range opening a step every second, slapped back once.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Straight road',
      params: { pace: 0.24, phrase: 3.8, rest: 0.8, tail: 1.9, grow: 1, drone: 0, seed: 60 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { release: 0.8, volume: -4.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.25 } },
      { deviceId: 're-amp', preset: 'Clean and bright', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'up-one-way-down-another-jasmine-lane',
    name: 'Jasmine lane',
    category: 'plucked',
    description:
      'A nylon guitar on Bihag over a buzzing plucked drone, the tune falling through notes it never climbs.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Night garden',
      params: {
        pace: 0.42,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.45,
        seed: 51,
      },
      parts: {
        drone: {
          deviceId: 'tanpura',
          preset: 'Evening Ni',
          params: { tuning: 1, speed: 3.5, volume: -12 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { strum: 0, release: 1, volume: 1 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-ferry-timetable',
    name: 'Ferry timetable',
    category: 'plucked',
    description:
      'Damped steel strings in a five-note air, short quick phrases with no drone, a dotted echo filling the silences.',
    preview: LET_GO,
    maker: {
      makerId: 'two-roads',
      preset: 'Harbour air',
      params: {
        pace: 0.23,
        phrase: 2.6,
        rest: 0.8,
        grow: 0,
        tail: 1.9,
        range: 9,
        drone: 0,
        seed: 3,
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { sustain: 1.2, release: 0.2, volume: 2.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.25 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Small bright tank',
        params: { mix: 0.14, breathDepth: 0 },
      },
    ],
  },
  {
    id: 'up-one-way-down-another-down-by-a-different-door',
    name: 'Down by a different door',
    category: 'plucked',
    description:
      'An open steel guitar in melodic minor without the notes the key lacks, home moving down a fourth, over slow dark bows.',
    preview: FOURTH_DOWN,
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: {
        pace: 0.45,
        phrase: 4.2,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        tonic: 5,
        dwell: 0.3,
        range: 7,
        drone: 0.4,
        seed: 63,
      },
      parts: {
        drone: {
          deviceId: 'chamber-strings',
          preset: 'Slow dark bows',
          params: { attack: 0.4, release: 1.2, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { strum: 0, release: 2, volume: -3.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.2 } }],
  },
  {
    id: 'up-one-way-down-another-sand-under-the-wheel',
    name: 'Sand under the wheel',
    category: 'plucked',
    description:
      'A hard nylon guitar near the bridge on the Hijaz path over a pumped organ, on a hissing four-track cassette.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Far caravan',
      params: {
        pace: 0.3,
        phrase: 3.6,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.3,
        seed: 22,
      },
      parts: {
        drone: { deviceId: 'organ', preset: 'Pump organ', params: { twelfth: 0, volume: -24 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { strum: 0, volume: 1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-fig-tree-in-the-court',
    name: 'Fig tree in the court',
    category: 'plucked',
    description:
      'Short plucked nylon on the Bayati path with the drone on the same strings, in a tight plate.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Courtyard',
      params: {
        pace: 0.26,
        phrase: 3.4,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        dwell: 0.25,
        range: 8,
        drone: 0.55,
        seed: 24,
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { sustain: 1, release: 0.3, volume: 1.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 16, outputGain: -5 } },
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-fourths-over-a-bridge',
    name: 'Fourths over a bridge',
    category: 'plucked',
    description:
      'A steel guitar picked at the bridge on Rageshri with no drone, its natural sixth and flat seventh both ways.',
    preview: HIGH_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Sixths and fourths',
      params: {
        pace: 0.34,
        phrase: 3.8,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 7,
        zigzag: 0.3,
        drone: 0,
        seed: 11,
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { strum: 0, release: 1.4, volume: 0.5 },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Wide' },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-keening-by-the-peat-fire',
    name: 'Keening by the peat fire',
    category: 'plucked',
    description:
      'A soft thumb in a minor gapped mode, every fall turned, phrases of eight or nine seconds over a night wind harp.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Lament',
      params: { pace: 0.85, phrase: 8.5, rest: 3.5, grow: 0, drone: 0.4, seed: 18, tail: 2.3 },
      parts: {
        drone: {
          deviceId: 'wind-harp',
          preset: 'Night wind',
          params: { air: 0.5, lull: 0, release: 2, volume: -12.5 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { strum: 0, sustain: 5, volume: 0 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Barely there' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-twelve-wires-at-the-loch',
    name: 'Twelve wires at the loch',
    category: 'plucked',
    description:
      'A twelve-string in a gapped mode with no drone, two echoes set wide, in bright open air.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Cold loch',
      params: {
        pace: 0.44,
        phrase: 4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0,
        seed: 46,
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 0, release: 1, volume: 0 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.18, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-one-more-step-each-turn',
    name: 'One more step each turn',
    category: 'plucked',
    description:
      'A nylon guitar unrolls Bhimpalasi in phrases near twenty seconds, a new step every sixteen, over a big dark gourd.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Slow opening',
      params: { pace: 1.1, phrase: 20, grow: 16, tail: 2.4, rest: 6, drone: 0.5, seed: 30 },
      parts: {
        drone: { deviceId: 'tanpura', preset: 'Low Ma gourd', params: { speed: 5, volume: -18.5 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { strum: 0, sustain: 8, release: 3, volume: -1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.22 } }],
  },
  {
    id: 'up-one-way-down-another-sun-on-every-bend',
    name: 'Sun on every bend',
    category: 'plucked',
    description:
      'A hard pick on ringing steel takes Asavari with turns in its falls, swinging slowly between the sides.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Late morning',
      params: {
        pace: 0.34,
        phrase: 4,
        rest: 1,
        tail: 1.9,
        grow: 1,
        range: 9,
        zigzag: 0.9,
        drone: 0,
        seed: 24,
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { release: 1.5, sustain: 5, tone: 0.8, volume: -2.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'up-one-way-down-another-bow-across-the-afternoon',
    name: 'Bow across the afternoon',
    category: 'string',
    description:
      'A cello-like bow on Bhimpalasi, phrases near seven seconds with three of rest, over a full buzzing drone.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Afternoon longing',
      params: { pace: 0.7, phrase: 7, rest: 3, grow: 0, range: 7, drone: 0.4, seed: 25, tail: 2.3 },
      parts: { drone: { deviceId: 'tanpura', preset: 'Ma full bloom', params: { volume: -12 } } },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.12, release: 0.8, volume: -9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-bow-on-the-red-road',
    name: 'Bow on the red road',
    category: 'string',
    description:
      'A pressed bow on the Hijaz path over a thin accordion reed; letting the lower key go lifts its resting note a fourth.',
    preview: HOME_RISES,
    maker: {
      makerId: 'two-roads',
      preset: 'Far caravan',
      params: {
        pace: 0.46,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        tonic: 4,
        range: 8,
        drone: 0.3,
        seed: 55,
      },
      parts: { drone: { deviceId: 'organ', preset: 'Accordion', params: { volume: -17 } } },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { pressure: 0.65, brightness: 0.6, attack: 0.1, release: 0.6, volume: -11 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-grey-glass-slow-bow',
    name: 'Grey glass, slow bow',
    category: 'string',
    description:
      'A light glassy bow on Bilaskhani with no drone, phrases near twelve seconds, its edges smeared in a faint haze.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Grey morning',
      params: { pace: 0.9, phrase: 12, rest: 5, grow: 0, range: 7, drone: 0, seed: 52, tail: 2.3 },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.4, release: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'up-one-way-down-another-two-sevenths-one-wire',
    name: 'Two sevenths, one wire',
    category: 'string',
    description:
      'A quick bright sustained string in melodic minor over its own held fifth, warm tape repeats behind it.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: {
        pace: 0.38,
        phrase: 4,
        rest: 1,
        grow: 0,
        tail: 1.6,
        dwell: 0.25,
        drone: 0.3,
        seed: 55,
      },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { brightness: 0.6, volume: -11 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.2 } }],
  },
  {
    id: 'up-one-way-down-another-folded-and-posted',
    name: 'Folded and posted',
    category: 'plucked',
    description:
      'A felted pluck on Nahawand from the root of the key, over held violas, two close doubles hovering at its sides.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Letter home',
      params: {
        pace: 0.4,
        phrase: 4,
        rest: 1,
        grow: 0,
        tail: 1.6,
        tonic: 2,
        range: 9,
        drone: 0.35,
        seed: 12,
      },
      parts: {
        drone: {
          deviceId: 'string-machine',
          preset: 'Violas',
          params: { attack: 0.3, release: 0.8, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { release: 0.8, volume: -6 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'up-one-way-down-another-wire-strung-to-the-lamps',
    name: 'Wire strung to the lamps',
    category: 'plucked',
    description:
      'A wire pluck on Yaman with no drone, the notes it has just played ringing on softly in tuned strings.',
    preview: HIGH_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'First lamps',
      params: { pace: 0.3, phrase: 3.8, rest: 1, grow: 0, tail: 1.6, range: 8, drone: 0, seed: 8 },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { release: 1.6, decay: 7, volume: -8 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'up-one-way-down-another-passing-the-fifth-by',
    name: 'Passing the fifth by',
    category: 'string',
    description:
      'A light soft bow on Bageshri, phrases of six seconds or so, over low sung vowels in a faint warm fuzz.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Past midnight',
      params: {
        pace: 0.7,
        phrase: 6,
        rest: 2.5,
        grow: 0,
        range: 7,
        drone: 0.35,
        seed: 30,
        tail: 2.3,
      },
      parts: {
        drone: {
          deviceId: 'choir',
          preset: 'Basses ah',
          params: { attack: 0.4, release: 1.2, volume: -11 },
        },
      },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.25, release: 1.2, volume: -8 },
    },
    effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.3 } }],
  },
  {
    id: 'up-one-way-down-another-between-two-menhirs',
    name: 'Between two menhirs',
    category: 'plucked',
    description:
      'Beating plucked strings on a gapped mode with no drone and no turns, drifting on slow tape in a dark hall.',
    preview: LOW_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Standing stones',
      params: {
        pace: 0.44,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 9,
        dwell: 0.25,
        drone: 0,
        seed: 25,
      },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { release: 1.8, decay: 8, detune: 18, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-damp-orchard-short-cut',
    name: 'Damp orchard, short cut',
    category: 'plucked',
    description:
      'A damped wooden pluck on Rageshri in quick phrases, a struck steel drone below, faint grains answering an octave up.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Sixths and fourths',
      params: {
        pace: 0.28,
        phrase: 3.4,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        range: 6,
        zigzag: 0.6,
        drone: 0.6,
        seed: 60,
      },
      parts: { drone: { deviceId: 'handpan', preset: 'Centre tone', params: { volume: -4.5 } } },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.2, decay: 1.6, volume: -4 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { pitch: 12, mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-opening-after-sundown',
    name: 'Opening after sundown',
    category: 'string',
    description: 'A picked string swells through Bihag over two soft reed tones, loosely doubled.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Night garden',
      params: {
        pace: 0.5,
        phrase: 4.2,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.35,
        seed: 15,
      },
      parts: {
        drone: {
          deviceId: 'dusk',
          preset: 'Soft clarinets',
          params: { attack: 0.2, release: 1, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 0.16, release: 1, volume: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-wind-round-the-circle',
    name: 'Wind round the circle',
    category: 'texture',
    description:
      'Strings lit by wind on a gapped mode, phrases near fourteen seconds and five of silence, out in a light breeze.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Standing stones',
      params: { pace: 1.4, phrase: 14, rest: 5, range: 6, drone: 0, seed: 1, tail: 2.3 },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { touch: 0.4, lull: 0, release: 2, volume: -4.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.22, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-wires-over-the-water',
    name: 'Wires over the water',
    category: 'texture',
    description:
      'Humming wires on a gapped mode, plucked by hand, with their own drone below on fluttering tape.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Cold loch',
      params: {
        pace: 0.5,
        phrase: 4,
        rest: 1.3,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0.4,
        seed: 49,
      },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { touch: 0.7, release: 1.2, hum: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-plucked-by-the-gale',
    name: 'Plucked by the gale',
    category: 'plucked',
    description:
      'Four plucked strings a note in a minor gapped mode, every fall turned, over a windy organ flute.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Lament',
      params: {
        pace: 0.42,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 7,
        zigzag: 1,
        drone: 0.35,
        seed: 31,
      },
      parts: {
        drone: {
          deviceId: 'organ',
          preset: 'Windy flute',
          params: { attack: 0.2, release: 1, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { release: 1, volume: -17 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-rigging-in-the-harbour',
    name: 'Rigging in the harbour',
    category: 'plucked',
    description:
      'A soft plucked wind string in a five-note air with no drone, its notes skipping off across the water.',
    preview: LET_GO,
    maker: {
      makerId: 'two-roads',
      preset: 'Harbour air',
      params: { pace: 0.3, phrase: 3, rest: 0.9, grow: 0, tail: 1.8, drone: 0, seed: 26 },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { release: 0.8, volume: -9 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.28 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-shimmer-before-the-lamps',
    name: 'Shimmer before the lamps',
    category: 'texture',
    description:
      'Shimmering courses on Yaman over two tapped glasses, the tail lifting very slowly in pitch.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'First lamps',
      params: {
        pace: 0.36,
        phrase: 4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 8,
        dwell: 0.3,
        drone: 0.5,
        seed: 18,
      },
      parts: { drone: { deviceId: 'modal-bells', preset: 'Tapped glass', params: { volume: -1 } } },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { touch: 0.9, wind: 0.35, release: 1.2, volume: -14 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Gentle' },
      { deviceId: 'spiral', preset: 'Faint lift', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'up-one-way-down-another-one-string-in-grey-air',
    name: 'One string in grey air',
    category: 'plucked',
    description:
      'One bare wind string on Bilaskhani, plucked and then breathed on, the quiet of its tail brought nearer.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Grey morning',
      params: {
        pace: 0.36,
        phrase: 4.4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 9,
        drone: 0,
        seed: 27,
      },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { touch: 0.9, release: 1.2, volume: -21.5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'up-one-way-down-another-wind-on-the-sharp-road',
    name: 'Wind on the sharp road',
    category: 'texture',
    description:
      'A humming harp in melodic minor with no drone, two sharps on the rise, under the dry browns of autumn.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: {
        pace: 0.44,
        phrase: 4,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        dwell: 0.3,
        range: 8,
        drone: 0,
        seed: 52,
      },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { touch: 0.7, release: 1.2, volume: -15 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Dry leaves', params: { mix: 0.6 } }],
  },
  {
    id: 'up-one-way-down-another-draught-past-midnight',
    name: 'Draught past midnight',
    category: 'texture',
    description:
      'Airy strings on Bageshri, phrases near eight seconds and three of rest, over a slow beating drone, far off.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Past midnight',
      params: {
        pace: 0.8,
        phrase: 8,
        rest: 3,
        grow: 12,
        range: 6,
        drone: 0.45,
        seed: 14,
        tail: 2.3,
      },
      parts: {
        drone: {
          deviceId: 'tanpura',
          preset: 'Slow wide beating',
          params: { tuning: 1, speed: 5, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { touch: 0.6, air: 0.5, lull: 0, release: 2, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.3 } }],
  },
  {
    id: 'up-one-way-down-another-rungs-in-the-breeze',
    name: 'Rungs in the breeze',
    category: 'texture',
    description:
      'One string climbing its own overtones on every note of the Rast map, thinly doubled, with no drone.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Straight road',
      params: {
        pace: 0.42,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 8,
        dwell: 0.4,
        drone: 0,
        seed: 27,
      },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { touch: 0.6, release: 0.8, volume: -1.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'up-one-way-down-another-sea-wind-in-the-court',
    name: 'Sea wind in the court',
    category: 'texture',
    description:
      'Breathing plucked strings on the Bayati path over a low breathy reed, held a toe under water.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Courtyard',
      params: {
        pace: 0.44,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.4,
        seed: 37,
      },
      parts: {
        drone: {
          deviceId: 'clarinet',
          preset: 'Subtone tenor',
          params: { attack: 0.15, volume: -6.5 },
        },
      },
    },
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Sea breeze',
      params: { touch: 0.8, lull: 0, air: 0.3, release: 1, volume: -9 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'A toe in' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-sand-on-the-hammers',
    name: 'Sand on the hammers',
    category: 'plucked',
    description:
      'Rolled hammers on a dulcimer take the Hijaz path with no drone, each note a soft tremolo on a plate.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Far caravan',
      params: { pace: 0.4, phrase: 4, rest: 1.1, grow: 0, tail: 1.6, range: 8, drone: 0, seed: 14 },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { chord: 0, strum: 0, roll: 12, release: 0.8, volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } }],
  },
  {
    id: 'up-one-way-down-another-box-in-the-night-garden',
    name: 'Box in the night garden',
    category: 'plucked',
    description:
      'A picked box of single strings on Bihag with its drone on the same box, in a small room that answers late.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Night garden',
      params: {
        pace: 0.34,
        phrase: 3.8,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.45,
        seed: 23,
      },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 0, strum: 0, decay: 4, release: 1.5, volume: -4 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.22 } }],
  },
  {
    id: 'up-one-way-down-another-sixths-plucked-twice',
    name: 'Sixths plucked twice',
    category: 'plucked',
    description:
      'A bare silk pluck on Rageshri over a still sustained tone, a murky echo saying each note again.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Sixths and fourths',
      params: {
        pace: 0.32,
        phrase: 3.6,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 6,
        zigzag: 0.4,
        drone: 0.35,
        seed: 53,
      },
      parts: {
        drone: {
          deviceId: 'bowed-string',
          preset: 'Still tone',
          params: { attack: 0.4, release: 1, volume: -19.5 },
        },
      },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { chord: 0, strum: 0, volume: -2.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.24 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'up-one-way-down-another-felt-hammer-in-the-court',
    name: 'Felt hammer in the court',
    category: 'plucked',
    description:
      'A single felted string on the Bayati path over a plain plucked drone of fourths, in a dark hall.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Courtyard',
      params: {
        pace: 0.28,
        phrase: 3.6,
        rest: 0.9,
        grow: 0,
        tail: 1.6,
        range: 8,
        dwell: 0.3,
        drone: 0.5,
        seed: 11,
      },
      parts: {
        drone: {
          deviceId: 'tanpura',
          preset: 'Plain plucked four',
          params: { tuning: 1, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { chord: 0, strum: 0, decay: 3.5, release: 1, volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.22 } }],
  },
  {
    id: 'up-one-way-down-another-harp-on-a-straight-road',
    name: 'Harp on a straight road',
    category: 'plucked',
    description:
      'A harp runs the Rast map a step wider each second and a half, octave loops of it stacked faintly above.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Straight road',
      params: {
        pace: 0.25,
        phrase: 4,
        rest: 0.9,
        tail: 1.9,
        grow: 1.5,
        range: 11,
        drone: 0,
        seed: 59,
      },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { chord: 0, strum: 0, release: 1.6, decay: 5, volume: -11 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Faint halo', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'up-one-way-down-another-homeward-on-two-hammers',
    name: 'Homeward on two hammers',
    category: 'plucked',
    description:
      'Octave hammer rolls in a minor gapped mode, all turns, in a slow drifting comb; a key an octave lower takes it down.',
    preview: OCTAVE_DOWN,
    maker: {
      makerId: 'two-roads',
      preset: 'Lament',
      params: {
        pace: 0.36,
        phrase: 4,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 6,
        zigzag: 1,
        drone: 0,
        seed: 35,
      },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { chord: 1, strum: 20, roll: 7, release: 1.2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'up-one-way-down-another-haze-over-the-letters',
    name: 'Haze over the letters',
    category: 'plucked',
    description:
      'Hazy octave strings on Nahawand over two warm filtered keys, each phrase left behind on a faint loop of tape.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Letter home',
      params: {
        pace: 0.36,
        phrase: 4,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 8,
        drone: 0.35,
        seed: 19,
      },
      parts: { drone: { deviceId: 'dusk', preset: 'Warm keys', params: { volume: -10.5 } } },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { chord: 1, strum: 15, decay: 5, release: 1.2, volume: -3 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Faint afterimage', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-shadow-of-a-felt-road',
    name: 'Shadow of a felt road',
    category: 'keys',
    description:
      'Felted octaves on Asavari with no drone, phrases near ten seconds, pure tones shadowing the strongest partials.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Late morning',
      params: { pace: 1, phrase: 10, rest: 4, grow: 0, range: 8, drone: 0, seed: 64, tail: 2.3 },
    },
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { sympathy: 0.5, decay: 8, release: 3, volume: -7.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Nearly dry' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'up-one-way-down-another-horns-at-the-stone-ring',
    name: 'Horns at the stone ring',
    category: 'wind',
    description:
      'Slow horns on a gapped mode, phrases near sixteen seconds and six of silence, their own drone under them.',
    preview: STILL_HELD,
    maker: {
      makerId: 'two-roads',
      preset: 'Standing stones',
      params: { pace: 1.9, phrase: 16, rest: 6, range: 5, drone: 0.4, seed: 39, tail: 2.3 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.5, release: 1.5, volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.22 } }],
  },
  {
    id: 'up-one-way-down-another-lament-for-the-flugel',
    name: 'Lament for the flugel',
    category: 'wind',
    description:
      'A breathy solo flugelhorn in a minor gapped mode, its falls turned, over chapel flutes.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Lament',
      params: {
        pace: 0.42,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0.3,
        seed: 19,
      },
      parts: { drone: { deviceId: 'organ', preset: 'Chapel flutes', params: { volume: -16 } } },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.07, release: 0.6, volume: -2 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-trumpet-on-the-quay',
    name: 'Trumpet on the quay',
    category: 'wind',
    description:
      'A soft open trumpet alone in a five-note air, asked again in its silence, a touch of spring around it.',
    preview: ASKED_AGAIN,
    maker: {
      makerId: 'two-roads',
      preset: 'Harbour air',
      params: {
        pace: 0.38,
        phrase: 3.4,
        rest: 2.6,
        grow: 0,
        tail: 1.6,
        range: 6,
        drone: 0,
        seed: 41,
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { vibrato: 0.3, attack: 0.06, release: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.22 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'up-one-way-down-another-muted-across-the-loch',
    name: 'Muted across the loch',
    category: 'wind',
    description:
      'A muted trumpet on a gapped mode over a low fog of ensemble strings, heard from the far shore.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Cold loch',
      params: {
        pace: 0.48,
        phrase: 4.2,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 5,
        drone: 0.4,
        seed: 52,
      },
      parts: {
        drone: {
          deviceId: 'string-machine',
          preset: 'Low fog',
          params: { attack: 0.4, release: 1, volume: -12.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.05, release: 0.6, volume: -2.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
  },
  {
    id: 'up-one-way-down-another-horn-going-both-ways',
    name: 'Horn going both ways',
    category: 'wind',
    description:
      'A solo horn in melodic minor, sharp going up and natural coming down, over two softer horns of its own.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: {
        pace: 0.36,
        phrase: 4.2,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        dwell: 0.3,
        range: 7,
        drone: 0.4,
        seed: 36,
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.06, release: 0.6, volume: -3.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'up-one-way-down-another-low-brass-before-light',
    name: 'Low brass before light',
    category: 'wind',
    description:
      'A low brass voice on Bilaskhani over soft synthetic horns, in a dark cave of reverb.',
    preview: MID_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Grey morning',
      params: {
        pace: 0.4,
        phrase: 3.6,
        rest: 1.1,
        grow: 0,
        tail: 1.6,
        range: 9,
        drone: 0.35,
        seed: 19,
      },
      parts: {
        drone: {
          deviceId: 'aurora',
          preset: 'Soft horns',
          params: { attack: 0.2, release: 1, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { attack: 0.08, blow: 0.5, release: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.22, breathDepth: 0 } },
    ],
  },
  {
    id: 'up-one-way-down-another-band-on-the-way-home',
    name: 'Band on the way home',
    category: 'wind',
    description:
      'A small brass band on Nahawand with no drone, on an old fast record with its own crackle.',
    preview: LOUDER_SECOND,
    maker: {
      makerId: 'two-roads',
      preset: 'Letter home',
      params: {
        pace: 0.44,
        phrase: 3.8,
        rest: 1,
        grow: 0,
        tail: 1.6,
        range: 7,
        drone: 0,
        seed: 39,
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.1, release: 0.5, volume: 0 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'up-one-way-down-another-sixth-from-the-tower',
    name: 'Sixth from the tower',
    category: 'wind',
    description:
      'A choir of flugelhorns on Rageshri, a distant bell struck at the start of each phrase, across an open valley.',
    preview: ONE_KEY,
    maker: {
      makerId: 'two-roads',
      preset: 'Sixths and fourths',
      params: {
        pace: 0.42,
        phrase: 3.8,
        rest: 1.2,
        grow: 0,
        tail: 1.6,
        range: 6,
        zigzag: 0.4,
        drone: 0.9,
        seed: 24,
      },
      parts: {
        drone: { deviceId: 'modal-bells', preset: 'Distant bell', params: { decay: 5, volume: 3 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.12, release: 0.8, volume: -1 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25, breathDepth: 0 } },
    ],
  },
]
