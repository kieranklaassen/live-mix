import { type FactoryPreset, type Phrase } from '../types'

// Night Drum has a drum for every key, so a preset here says first which hand
// is on the skin and then what the skin is stretched over: rolled or held it is
// a pad or a voice, struck once it is keys, a bass or a bell. Effects that add
// pitches of their own are left out, so that the only overtones are the skin's,
// and the rooms are thin where the drum is low.

/** Single strokes with air between them, so that a ring is heard to its end. */
const STROKES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 50, gain: 0.8 },
    { atSec: 0.9, durSec: 0.4, note: 57, gain: 0.6 },
    { atSec: 1.35, durSec: 1.2, note: 60, gain: 0.7 },
    { atSec: 2.7, durSec: 0.4, note: 57, gain: 0.5 },
    { atSec: 3.1, durSec: 1.2, note: 62, gain: 0.8 },
    { atSec: 4.4, durSec: 1.6, note: 53, gain: 0.7 },
    { atSec: 4.4, durSec: 1.6, note: 65, gain: 0.5 },
  ],
}

/** A slow low call of three drums. */
const LOW_CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 38, gain: 0.9 },
    { atSec: 1.8, durSec: 0.6, note: 45, gain: 0.6 },
    { atSec: 2.5, durSec: 1.8, note: 41, gain: 0.8 },
    { atSec: 4.6, durSec: 1.8, note: 36, gain: 0.9 },
  ],
}

/** A figure for dry and plucked skins. */
const FIGURE: Phrase = {
  notes: [62, 69, 65, 72, 60, 67, 64, 72, 57, 65, 69, 76, 60, 64, 69, 62].map((note, i) => ({
    atSec: i * 0.4,
    durSec: 0.3,
    note,
    gain: i % 4 === 0 ? 0.85 : 0.6,
  })),
}

/** A drone of two keys with a third that comes and goes. */
const DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 50, gain: 0.8 },
    { atSec: 0.3, durSec: 6.1, note: 57, gain: 0.6 },
    { atSec: 2.4, durSec: 2.6, note: 64, gain: 0.5 },
  ],
}

export const NIGHT_DRUM_PRESETS: readonly FactoryPreset[] = [
  // Fingertip pads.
  {
    id: 'night-drum-fingertips-at-dusk',
    name: 'Fingertips at dusk',
    category: 'pad',
    description:
      'Soft fingertips rolling on five loaded skins that blend into one slow breathing chord, in a warm hall.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Fingertip pad',
      params: { swell: 0.8, ring: 4, grain: 0.25, volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } }],
  },
  {
    id: 'night-drum-many-thumbs',
    name: 'Many thumbs',
    category: 'pad',
    description:
      'Dark thumbs rolling on wide kettles, slow to rise, with a soft chorus and a dark plate behind them.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Fingertip pad',
      params: {
        hand: 1,
        roll: 20,
        cavity: 2,
        swell: 1.8,
        ring: 7,
        scatter: 0.6,
        offCentre: 0.35,
        otherSkin: 0.4,
        otherTune: 19,
        width: 0.9,
        bend: 0,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  // Speaking basses.
  {
    id: 'night-drum-spoken-low',
    name: 'Spoken low',
    category: 'bass',
    description:
      'A thumb on a round pot: every bass note starts well above its key and falls back on it, gently warmed.',
    instrument: { deviceId: 'night-drum', preset: 'Speaking bass', params: { volume: -4 } },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth' }],
  },
  {
    id: 'night-drum-asks-a-question',
    name: 'Bass asks a question',
    category: 'bass',
    description:
      'A low tube of a drum whose notes bend up into place and speak like a vowel, dry and close on warm tape.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Talking drum',
      params: { bend: -5, fall: 0.2, ring: 9, cavityTune: -4, scatter: 0, width: 0.2, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.12 } },
    ],
  },
  // Rubbed moans.
  {
    id: 'night-drum-moan-in-the-cave',
    name: 'Moan in the cave',
    category: 'voice',
    description:
      'A dry finger drawn over a tube drum, which moans up to its note and wavers there, deep in a cave.',
    instrument: { deviceId: 'night-drum', preset: 'Rubbed moan', params: { volume: 2 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.24 } }],
    preview: 'line',
  },
  {
    id: 'night-drum-ring-round-the-rim',
    name: 'Ring round the rim',
    category: 'pad',
    description:
      'Fingers rubbed at the edge of tight kettles, thin and clear like wet glass, slow to come, in a cathedral.',
    instrument: { deviceId: 'night-drum', preset: 'Singing rim', params: { roll: 0, volume: -4 } },
    effects: [
      { deviceId: 'murmuration', preset: 'Slow drift' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.24 } },
    ],
  },
  // Hummed voices.
  {
    id: 'night-drum-hum-at-the-door',
    name: 'Hum at the door',
    category: 'voice',
    description:
      'A bright hum sent into a small pot, its overtones standing like a vowel, with low humming in the room.',
    instrument: { deviceId: 'night-drum', preset: 'Hummed voice', params: { volume: -8 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Humming', params: { mix: 0.22 } }],
  },
  {
    id: 'night-drum-trembling-breath',
    name: 'Trembling breath',
    category: 'voice',
    description:
      'A soft dark hum into wide kettles whose breath shakes a few times a second, far back on a long plate.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Hummed voice',
      params: {
        cavity: 2,
        cavityTune: 3,
        roll: 9,
        touch: 0.3,
        grain: 0.6,
        swell: 1.5,
        scatter: 0.3,
        otherSkin: 0.5,
        otherTune: 7,
        ring: 1,
        width: 0.9,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
  },
  // Kettle bells.
  {
    id: 'night-drum-kettles-on-the-hill',
    name: 'Kettles on the hill',
    category: 'bell',
    description:
      'Hard sticks on small tight kettles that ring in fifths, each pair of overtones beating, in an open valley.',
    instrument: { deviceId: 'night-drum', preset: 'Kettle bells', params: { volume: -0.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.24 } }],
  },
  {
    id: 'night-drum-velvet-kettles',
    name: 'Velvet kettles',
    category: 'bell',
    description:
      'Soft strokes in the middle of large kettles, long and round, with a twelfth blooming after, far away.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Kettle bells',
      params: {
        hand: 0,
        cavityTune: 2,
        touch: 0.2,
        skin: 0.6,
        ring: 10,
        place: 0.35,
        otherSkin: 0.8,
        otherTune: 19,
        offCentre: 0.15,
        bend: 1,
        fall: 0.4,
        width: 0.8,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.25 } },
    ],
    preview: STROKES,
  },
  // Dry hand keys.
  {
    id: 'night-drum-bare-hands',
    name: 'Bare hands',
    category: 'keys',
    description:
      'Fingers on skins with no body under them, thin, short and close, spread wide in a very small room.',
    instrument: { deviceId: 'night-drum', preset: 'Dry hand keys', params: { volume: 2.2 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } }],
    preview: FIGURE,
  },
  {
    id: 'night-drum-pots-on-a-string',
    name: 'Pots on a string',
    category: 'keys',
    description:
      'Round gulping pots played with firm fingers and damped by the palm, with a hint of spring and tape.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Dry hand keys',
      params: {
        cavity: 1,
        cavityTune: -3,
        touch: 0.5,
        ring: 6,
        damp: 0.25,
        grain: 0.25,
        load: 1,
        bend: 0.6,
        place: 0.35,
        width: 0.5,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
    preview: 'keys',
  },
  // Paired skins.
  {
    id: 'night-drum-two-skins-in-fifths',
    name: 'Two skins in fifths',
    category: 'pad',
    description:
      'Rolled skins whose far side is tuned a fifth up and answers as loudly as the near one, on a long plate.',
    instrument: { deviceId: 'night-drum', preset: 'Paired skins', params: { volume: -5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } }],
  },
  {
    id: 'night-drum-answer-from-below',
    name: 'Answer from below',
    category: 'keys',
    description:
      'One stroke above, and a second skin an octave down that swells up after it, moved by slow water.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Paired skins',
      params: {
        roll: 0,
        scatter: 0,
        swell: 0.01,
        otherTune: -12,
        ring: 8,
        touch: 0.65,
        place: 0.7,
        cavity: 0,
        skin: 0.7,
        offCentre: 0.1,
        volume: -3.8,
      },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.18 } },
    ],
    preview: STROKES,
  },
  // Bare thunder.
  {
    id: 'night-drum-thunder-under-ground',
    name: 'Thunder under ground',
    category: 'texture',
    description:
      'Palms rolling on bare unloaded kettles, every overtone clashing with the next, rumbling in a dark cave.',
    instrument: { deviceId: 'night-drum', preset: 'Bare thunder', params: { volume: -2.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.2 } }],
    preview: DRONE,
  },
  {
    id: 'night-drum-first-storm',
    name: 'First storm of the year',
    category: 'drum',
    description:
      'Single heavy palms on half loaded kettles, bending down about a fifth as they ring, with a long dark trail.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Bare thunder',
      params: {
        roll: 0,
        scatter: 0.15,
        swell: 0.01,
        load: 0.3,
        offCentre: 0.5,
        bend: 7,
        fall: 0.6,
        ring: 12,
        grain: 0.35,
        otherSkin: 0.3,
        volume: -5,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.2 } }],
    preview: LOW_CALL,
  },
  // Thread drones.
  {
    id: 'night-drum-gut-on-the-skin',
    name: 'Gut on the skin',
    category: 'drone',
    description:
      'A hum into tubes with a gut thread lying on them, rattling under an octave below, in a dark hall.',
    instrument: { deviceId: 'night-drum', preset: 'Thread drone', params: { volume: -2 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } }],
    preview: DRONE,
  },
  {
    id: 'night-drum-wind-in-the-threads',
    name: 'Wind in the threads',
    category: 'drone',
    description:
      'Brushes swirling over shallow skins and the threads on them, more breath than tone, behind thin fog.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Brushed night',
      params: { thread: 0.6, roll: 2.5, scatter: 0.8, swell: 2, width: 0.9, volume: -1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  // Plucked skins.
  {
    id: 'night-drum-tight-as-a-string',
    name: 'Tight as a string',
    category: 'plucked',
    description:
      'Thin tight skins flicked near the rim, as short and bright as a plucked string, in a room.',
    instrument: { deviceId: 'night-drum', preset: 'Plucked skin', params: { volume: 2 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } }],
    preview: FIGURE,
  },
  {
    id: 'night-drum-flicked-tubes',
    name: 'Flicked tubes',
    category: 'plucked',
    description:
      'Small tubes flicked hard near the middle, each a nasal vowel that rises into its note, in warm repeats.',
    instrument: {
      deviceId: 'night-drum',
      preset: 'Plucked skin',
      params: {
        cavity: 3,
        cavityTune: 5,
        place: 0.3,
        ring: 5,
        damp: 0.2,
        bend: -3,
        fall: 0.06,
        grain: 0.15,
        width: 0.4,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.24 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.14 } },
    ],
    preview: FIGURE,
  },
]
