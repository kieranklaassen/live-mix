import { type FactoryPreset, type Phrase } from '../types'

// A held key runs eight chords, and every sound here plays a role in them:
// chords, lowest notes, a broken chord, a top line, the tonic. Laid out by
// spine, sixteen of them, six or seven sounds on each, every spine a place
// in one large house. Most take two seconds a chord, so that sounds on one
// spine can be stacked.

// One key held for six seconds: three chords of two seconds, or four of one and a half.
const ONE_KEY: Phrase = { notes: [{ atSec: 0, durSec: 5.95, note: 60, gain: 0.65 }] }
// The same held nearly to the end, for what is struck or plucked.
const LONG_KEY: Phrase = { notes: [{ atSec: 0, durSec: 7.3, note: 60, gain: 0.62 }] }
// A lower key, for sounds that take their octave from the hand.
const LOW_KEY: Phrase = { notes: [{ atSec: 0, durSec: 7.3, note: 55, gain: 0.62 }] }
// The tonic two octaves under middle C.
const DEEP_KEY: Phrase = { notes: [{ atSec: 0, durSec: 6.6, note: 36, gain: 0.65 }] }
// Seven seconds of one key: seven chords of a second.
const SEVEN_STEPS: Phrase = { notes: [{ atSec: 0, durSec: 6.97, note: 60, gain: 0.62 }] }
// A key added before each change: every chord of two seconds is louder than the one before.
const LOUDER: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.36 },
    { atSec: 1.9, durSec: 5.3, note: 64, gain: 0.55 },
    { atSec: 3.9, durSec: 3.3, note: 67, gain: 0.78 },
  ],
}
// Three keys let go one by one, the loudest first: every chord of two seconds is softer.
const SOFTER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.95, note: 67, gain: 0.78 },
    { atSec: 0, durSec: 3.95, note: 64, gain: 0.56 },
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.36 },
  ],
}
// A breath of half a second, shorter than a chord: the count goes on through it.
const BREATH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 60, gain: 0.6 },
    { atSec: 4, durSec: 3.2, note: 60, gain: 0.66 },
  ],
}
// A rest longer than a chord of a second and a half: the spine begins again, a refrain.
const REFRAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.95, note: 60, gain: 0.68 },
    { atSec: 4.5, durSec: 2.8, note: 60, gain: 0.5 },
  ],
}
// Four short keys, one for each chord of two seconds: chords with air between them.
const DETACHED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 60, gain: 0.64 },
    { atSec: 2, durSec: 1.2, note: 60, gain: 0.56 },
    { atSec: 4, durSec: 1.2, note: 60, gain: 0.66 },
    { atSec: 6, durSec: 1.1, note: 60, gain: 0.5 },
  ],
}
// One key for each chord of two seconds, an octave up, up and down again.
const OCTAVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.97, note: 55, gain: 0.6 },
    { atSec: 2, durSec: 1.97, note: 67, gain: 0.58 },
    { atSec: 4, durSec: 1.97, note: 79, gain: 0.52 },
    { atSec: 6, durSec: 1.3, note: 67, gain: 0.5 },
  ],
}
// Two chords of two seconds from C, then two from D: the spine moves a step up.
const STEP_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.97, note: 60, gain: 0.62 },
    { atSec: 4, durSec: 3.2, note: 62, gain: 0.62 },
  ],
}
// Two chords of a second and a half from C, then two from the A under it.
const TWO_HOMES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.97, note: 60, gain: 0.64 },
    { atSec: 3, durSec: 2.95, note: 57, gain: 0.64 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Sevenths: the long gallery, F E D C.
  {
    id: 'many-rooms-one-spine-gallery-at-four',
    name: 'Gallery at four',
    category: 'pad',
    description:
      'A chorus synth plays falling sevenths in open position with their roots under them, two seconds each, its bands drifting in a hall.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Falling sevenths',
      params: { chord: 2, voicing: 1, bass: 0.5 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0.15, attack: 0.25, release: 1.4, volume: -12 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-portraits-in-a-row',
    name: 'Portraits in a row',
    category: 'plucked',
    description:
      'A nylon guitar breaks falling sevenths from the root up, in eighths, while a recorder holds the top note of each.',
    preview: BREATH,
    maker: {
      makerId: 'one-spine',
      preset: 'Falling sevenths',
      params: { role: 2, chord: 2, voicing: 3, steps: 8, bell: 0.6 },
      parts: { bell: { deviceId: 'flute', preset: 'Soft recorder', params: { volume: -12 } } },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { release: 1.2, volume: 0.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'many-rooms-one-spine-parquet-descending',
    name: 'Parquet, descending',
    category: 'bass',
    description:
      'A plucked upright walks F E D C under soft flute pipes that hold the sevenths, through a small amplifier.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Falling sevenths',
      params: { role: 1, chord: 2, pad: 0.45 },
      parts: {
        pad: {
          deviceId: 'organ',
          preset: 'Chapel flutes',
          params: { attack: 0.08, release: 0.4, volume: -9.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 4, volume: 6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'many-rooms-one-spine-a-seventh-over-each',
    name: 'A seventh over each',
    category: 'bell',
    description:
      'A handpan strikes one top note to a chord, four falling sevenths first, an octave down from a middle key, in a ring of bowls.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Falling sevenths',
      params: { role: 3, chord: 1.5, keys: 1 },
    },
    instrument: { deviceId: 'handpan', preset: 'Soft hands', params: { volume: -1 } },
    effects: [
      { deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-seventh-chord-recess',
    name: 'Seventh chord recess',
    category: 'keys',
    description:
      'Tine chords of four notes, struck every second and a half; leave a longer rest and the first one comes again.',
    preview: REFRAIN,
    maker: { makerId: 'one-spine', preset: 'Falling sevenths', params: { chord: 1.5, voicing: 3 } },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tremolo: 0.1, release: 0.5, volume: -19 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-one-note-for-four-chords',
    name: 'One note for four chords',
    category: 'drone',
    description:
      'Low octaves of C hum under four sevenths that a muted harp breaks, five notes to a chord, the lows thickened.',
    preview: DEEP_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Falling sevenths',
      params: { role: 4, chord: 2, voicing: 3, steps: 5, keys: 1, common: 1, arp: 0.6 },
      parts: { arp: { deviceId: 'harp', preset: 'Muted harp', params: { volume: -8 } } },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { attack: 0.8, release: 1.6, sub: 0.3, cutoff: 900, volume: -14 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'many-rooms-one-spine-the-long-gallery-lit',
    name: 'The long gallery, lit',
    category: 'pad',
    description:
      'A whole band on the falling sevenths: swelling brass chords, a fretless bass, a thumb piano and a clarinet on top.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'All five',
      params: { chord: 2, common: 1, steps: 6, drone: 0 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Singing fretless', params: { volume: -8 } },
        arp: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -9 } },
        bell: { deviceId: 'clarinet', preset: 'Warm clarinet', params: { volume: -9 } },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { attack: 0.2, swell: 0.4, release: 1.2, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0, wow: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },

  // Lament: the chapel under the house, A G F E.
  {
    id: 'many-rooms-one-spine-undercroft-swell',
    name: 'Undercroft swell',
    category: 'pad',
    description:
      'Soft synth horns set the falling bass of a lament under wide triads, louder as keys are added, in a hall that sings ah.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Lament for strings',
      params: { chord: 2, voicing: 2, bass: 0, common: 0 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { lowCut: 60, attack: 0.3, release: 1.3, swell: 0.3, volume: -10 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { vowel: 0, decay: 3 } }],
  },
  {
    id: 'many-rooms-one-spine-steps-to-the-crypt',
    name: 'Steps to the crypt',
    category: 'bass',
    description:
      'The lament bass alone on dark flat strings, A G F E D and back, a second and a half to a note, warmed by a valve.',
    preview: BREATH,
    maker: { makerId: 'one-spine', preset: 'Lament bass', params: { chord: 1.5 } },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { sustain: 3, release: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'many-rooms-one-spine-candle-counting',
    name: 'Candle counting',
    category: 'plucked',
    description:
      'Wooden plucks count out a lament six to a chord, over two soft notes of a viol that frame each one.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Lament for strings',
      params: { role: 2, voicing: 4, steps: 6, chord: 2, bass: 0, pad: 0.6 },
      parts: {
        pad: {
          deviceId: 'chamber-strings',
          preset: 'Viol consort',
          params: { attack: 0.2, release: 0.8, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { decay: 0.9, chance: 0.05, volume: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'many-rooms-one-spine-wax-on-the-keys',
    name: 'Wax on the keys',
    category: 'keys',
    description:
      'A dark tine piano breaks the lament in four wide notes a chord, its repeats getting duller on a worn echo.',
    preview: LOW_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Lament for strings',
      params: { role: 2, voicing: 2, steps: 4, chord: 2, bass: 0, keys: 1 },
    },
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -9 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 500, feedback: 0.4, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'many-rooms-one-spine-glass-over-the-tomb',
    name: 'Glass over the tomb',
    category: 'bell',
    description:
      'The top line of the lament on bell-like glass, a low bowed cello walking its bass, in a long shining tail.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Lament bass',
      params: { role: 3, chord: 2, bass: 0.7 },
      parts: {
        bass: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.15, release: 0.5, volume: -13 },
        },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 2, volume: -9 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.25 } }],
  },
  {
    id: 'many-rooms-one-spine-all-in-the-crypt',
    name: 'All in the crypt',
    category: 'plucked',
    description:
      'A lament for a band: steel guitar in sixes, a soft ooh holding the chords, a bass guitar and a glass organ on the top notes.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Lament for strings',
      params: { role: 2, voicing: 0, steps: 6, chord: 2, pad: 0.5, bass: 0.7, bell: 0.5 },
      parts: {
        pad: {
          deviceId: 'choir',
          preset: 'Boys ooh',
          params: { attack: 0.2, release: 0.8, volume: -14.5 },
        },
        bass: { deviceId: 'string-bass', preset: 'Thumb at the neck', params: { volume: -4 } },
        bell: {
          deviceId: 'fm-glass',
          preset: 'Glass organ',
          params: { release: 0.8, volume: -20.5 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { release: 0.8, volume: -3 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },

  // Turning: the hall with the revolving door, C Am Dm G (the cloakroom beside it is on the fifths).
  {
    id: 'many-rooms-one-spine-revolving-door',
    name: 'Revolving door',
    category: 'plucked',
    description:
      'A twelve-string goes round C, Am, Dm and G, eight notes to a chord with the bass note in the figure, slowly panned.',
    preview: LOW_KEY,
    maker: { makerId: 'one-spine', preset: 'Turning harp', params: { chord: 2, keys: 1 } },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { release: 0.9, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'many-rooms-one-spine-brass-handles',
    name: 'Brass handles',
    category: 'keys',
    description:
      'Short warm synth notes, seven to a chord, turn round a homely progression, each answered by a dotted tape echo.',
    preview: BREATH,
    maker: {
      makerId: 'one-spine',
      preset: 'Turning harp',
      params: { chord: 2, voicing: 0, steps: 7 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: { release: 0.4, cutoff: 700, chorus: 1, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 428, feedback: 0.35, mix: 0.25 },
      },
    ],
  },
  {
    id: 'many-rooms-one-spine-cloakroom-choir',
    name: 'Cloakroom choir',
    category: 'pad',
    description:
      'Vowels sing F and C while a C is held, then Am and Em from a D: the lowest key says where the rising fifths stand.',
    preview: STEP_UP,
    maker: {
      makerId: 'one-spine',
      preset: 'Where you stand',
      params: { spine: 10, chord: 2, bass: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.25, release: 1.3, volume: -4.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-door-bell-at-noon',
    name: 'Door bell at noon',
    category: 'bell',
    description:
      'A handpan strikes the top note of each turning chord as a harmonium holds all three, in a stone stairwell.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Turning harp',
      params: { role: 3, voicing: 0, chord: 2, keys: 1, pad: 0.5 },
      parts: {
        pad: {
          deviceId: 'organ',
          preset: 'Harmonium',
          params: { attack: 0.1, release: 0.4, volume: -16.5 },
        },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { volume: -0.5 } },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'many-rooms-one-spine-hat-stand-bass',
    name: 'Hat stand bass',
    category: 'bass',
    description:
      'A picked bass plays the roots of a turn, C A D G, its short notes rattling a little against a compressor.',
    preview: DETACHED,
    maker: { makerId: 'one-spine', preset: 'Turning harp', params: { role: 1, chord: 2 } },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { growl: 0.6, tone: 0.65, release: 0.3, volume: 0 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-umbrella-drips',
    name: 'Umbrella drips',
    category: 'bell',
    description:
      'Small folded chimes sound the top of each turning chord and leave skipping echoes that close up as they fade.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Where you stand',
      params: { role: 3, keys: 0, chord: 1.5, bass: 0 },
    },
    instrument: { deviceId: 'west-coast', preset: 'Small chimes', params: { volume: -1 } },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Ball on glass' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-everyone-comes-in',
    name: 'Everyone comes in',
    category: 'keys',
    description:
      'Tine chords on the turn with three players: an upright bass, a thumbed guitar in fours, a straight flute along the top.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'All five',
      params: { spine: 2, chord: 2, drone: 0 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Dark soft upright', params: { volume: -3.5 } },
        arp: {
          deviceId: 'acoustic-guitar',
          preset: 'Soft thumb',
          params: { strum: 0, volume: -3.5 },
        },
        bell: { deviceId: 'flute', preset: 'Straight tone', params: { volume: -14.5 } },
      },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremolo: 0.4, release: 0.4, volume: -17.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // Borrowed: the room of the lodger, with an A flat that is not the key's.
  {
    id: 'many-rooms-one-spine-lent-for-the-night',
    name: 'Lent for the night',
    category: 'keys',
    description:
      'Tine chords go from C to F, to F minor with its borrowed A flat, and home, under a slow sway from ear to ear.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Borrowed evening',
      params: { chord: 1.5, voicing: 1, bell: 0 },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { release: 1, volume: -11 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-a-borrowed-flat',
    name: 'A borrowed flat',
    category: 'pad',
    description:
      'A hollow brass choir ties what the borrowed chords share: F and C stay put and one voice goes from A to A flat.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Borrowed evening',
      params: { chord: 2, voicing: 0, bell: 0, common: 1 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { attack: 0.3, release: 1.2, volume: -9 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { decay: 5, mix: 0.3 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-what-the-lodger-drums',
    name: 'What the lodger drums',
    category: 'plucked',
    description:
      'A tongue drum breaks the borrowed chords in six from a low key, every stroke clean, its tail carried by a spring.',
    preview: LOW_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Borrowed evening',
      params: { role: 2, chord: 2, voicing: 0, steps: 6, keys: 1, bell: 0 },
    },
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { decay: 3.5, volume: -6 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Narrow warm tank' }],
  },
  {
    id: 'many-rooms-one-spine-rent-in-silver',
    name: 'Rent in silver',
    category: 'bell',
    description:
      'A plucked steel string, doubled a little off pitch, for the top of each borrowed chord, over a humming choir that holds the rest.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Borrowed evening',
      params: { role: 3, chord: 2, voicing: 1, pad: 0.5 },
      parts: {
        pad: {
          deviceId: 'choir',
          preset: 'Humming',
          params: { attack: 0.2, release: 0.9, volume: -11.5 },
        },
      },
    },
    instrument: { deviceId: 'acoustic-guitar', preset: 'Bare string', params: { volume: -2 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-spare-room-reeds',
    name: 'Spare room reeds',
    category: 'keys',
    description:
      'A reed wave plays the borrowed chords five notes at a time, with a slow notch passing through them.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Borrowed evening',
      params: { role: 2, chord: 1.5, voicing: 3, steps: 5, bell: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.02, release: 0.3, volume: -6.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-key-under-the-mat',
    name: 'Key under the mat',
    category: 'bass',
    description:
      'A folded bass pulse on C F F C, under string machine violas on the borrowed chords, its lows held to the middle.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Borrowed evening',
      params: { role: 1, chord: 1.5, voicing: 0, bell: 0, pad: 0.5 },
      parts: {
        pad: {
          deviceId: 'string-machine',
          preset: 'Violas',
          params: { attack: 0.15, release: 0.7, volume: -4.5 },
        },
      },
    },
    instrument: { deviceId: 'west-coast', preset: 'Round bass', params: { volume: 2.5 } },
    effects: [
      { deviceId: 'spread', preset: 'Firm bass' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },

  // Circle: the rotunda, falling fifths in sevenths.
  {
    id: 'many-rooms-one-spine-round-the-rotunda',
    name: 'Round the rotunda',
    category: 'pad',
    description:
      'Sevenths fall by fifths, Am Dm G C, root lowest, on a wide pulse that ties over every note two chords share.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Circle, unhurried',
      params: { chord: 2, voicing: 3, bass: 0, bell: 0 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { attack: 0.3, release: 1.4, volume: -10 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'many-rooms-one-spine-fifths-on-the-marble',
    name: 'Fifths on the marble',
    category: 'bass',
    description:
      'A growling fretless plays A D G C round the circle, under two soft glass notes that frame each seventh and tie over.',
    preview: SOFTER,
    maker: {
      makerId: 'one-spine',
      preset: 'Circle, unhurried',
      params: { role: 1, chord: 2, bell: 0, pad: 0.5, voicing: 4 },
      parts: {
        pad: {
          deviceId: 'fm-glass',
          preset: 'Warm glass pad',
          params: { attack: 0.1, release: 1, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { release: 0.4, volume: 0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'many-rooms-one-spine-columns-passing',
    name: 'Columns passing',
    category: 'plucked',
    description:
      'A steel guitar picked at the bridge breaks the circle in nines, root lowest, and throws off a few sparks an octave higher.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Circle, unhurried',
      params: { role: 2, chord: 2, voicing: 3, steps: 9, bass: 0, bell: 0 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { release: 2.5, sustain: 8, body: 0.8, tone: 0.6, volume: -1.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -4 } },
      { deviceId: 'glints', preset: 'First light', params: { pitch: 0, mix: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-drops-from-the-oculus',
    name: 'Drops from the oculus',
    category: 'bell',
    description:
      'A glassy folded bell on the top notes of the circle, over tied string chords, each stroke spread to scattered echoes.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Circle, unhurried',
      params: { role: 3, chord: 2, bass: 0, pad: 0.5 },
      parts: {
        pad: {
          deviceId: 'string-machine',
          preset: 'Muted violins',
          params: { attack: 0.2, release: 0.9, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { decay: 3, volume: -2.5 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.25 } }],
  },
  {
    id: 'many-rooms-one-spine-a-full-rotunda',
    name: 'A full rotunda',
    category: 'pad',
    description:
      'Saw chords fall round the circle with a low electric bass, a concert harp in eighths and vibraphone tops.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Circle, unhurried',
      params: { chord: 2, steps: 8, bass: 0.75, arp: 0.5, bell: 0.5 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Warm fingers', params: { volume: -5 } },
        arp: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -6 } },
        bell: { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -8 } },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.3, release: 1, cutoff: 1800, volume: -10 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'many-rooms-one-spine-whisper-round-the-dome',
    name: 'Whisper round the dome',
    category: 'wind',
    description:
      'Loose synth reeds take the top notes of the circle as a slow tune, with two copies of themselves circling close by.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Circle, unhurried',
      params: { role: 3, chord: 2, bass: 0 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { attack: 0.06, release: 0.9, volume: -4.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // Tides: the boathouse, two ninths rocking over the tonic.
  {
    id: 'many-rooms-one-spine-boathouse-at-low-tide',
    name: 'Boathouse at low tide',
    category: 'pad',
    description:
      'Wide synth strings rock between two open ninths over a held C, two and a half seconds each, rising and sinking as a tide does.',
    preview: ONE_KEY,
    maker: { makerId: 'one-spine', preset: 'Tides', params: { chord: 2.5, drone: 0.35 } },
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.5, release: 1.5, brilliance: 3000, volume: -10 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { depth: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 8, mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-hull-under-two-ninths',
    name: 'Hull under two ninths',
    category: 'drone',
    description:
      'A low hum on C two octaves down; over it a glass bell for each ninth and three slow rising notes of an alto flute.',
    preview: DEEP_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Tonic and air',
      params: { chord: 2, keys: 1, common: 1, bell: 0.6, arp: 0.5 },
      parts: {
        bell: { deviceId: 'fm-glass', preset: 'Glass bell', params: { release: 1.5, volume: -16 } },
        arp: { deviceId: 'flute', preset: 'Alto flute', params: { release: 0.3, volume: -18 } },
      },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { attack: 0.6, release: 1.4, cutoff: 420, volume: -14 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 3, mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-buoys-answer-in-ninths',
    name: 'Buoys answer in ninths',
    category: 'bell',
    description:
      'A round filter tone rings the top of each ninth, a second and a half apart, and comes back backwards between them.',
    preview: LONG_KEY,
    maker: { makerId: 'one-spine', preset: 'Tides', params: { role: 3, chord: 1.5, drone: 0 } },
    instrument: {
      deviceId: 'dusk',
      preset: 'Round sine',
      params: { cutoff: 261.6, release: 0.9, volume: -12 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 750, feedback: 0.15, mix: 0.35 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-rope-against-the-cleat',
    name: 'Rope against the cleat',
    category: 'plucked',
    description:
      'A damped handpan taps the tidal ninths from the root up, in eights, with a faint scatter of short echoes behind it.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Tides',
      params: { role: 2, chord: 2, voicing: 3, steps: 8, drone: 0 },
    },
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { decay: 1.6, damp: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Faint scatter', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'many-rooms-one-spine-lantern-on-the-slipway',
    name: 'Lantern on the slipway',
    category: 'keys',
    description:
      'Tine bells climb each ninth in three wide steps while a soft reed organ keeps the tonic, rippling as water does.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Tonic and air',
      params: { role: 2, chord: 2, voicing: 1, steps: 3, bell: 0, common: 1, drone: 0.5 },
      parts: {
        drone: {
          deviceId: 'organ',
          preset: 'Shruti box',
          params: { attack: 0.3, release: 0.6, volume: -14.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { release: 0.9, volume: -9 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples' },
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
    ],
  },
  {
    id: 'many-rooms-one-spine-mist-off-the-jetty',
    name: 'Mist off the jetty',
    category: 'pad',
    description:
      'A hollow wave swells slowly on two ninths over one C, six seconds each, its attacks blurred, a little thin air around it.',
    preview: LONG_KEY,
    maker: { makerId: 'one-spine', preset: 'Tides', params: { chord: 6, voicing: 0, drone: 0.4 } },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 1.2, release: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist' },
      { deviceId: 'noise-floor', preset: 'Thin bright air', params: { level: -60 } },
    ],
  },

  // Climb: the way to the roof, C D E F G A.
  {
    id: 'many-rooms-one-spine-attic-ladder',
    name: 'Attic ladder',
    category: 'plucked',
    description:
      'A nylon guitar climbs from C to F, five notes to a chord, root first, and a grain delay throws octave glints off them.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Morning climb',
      params: { chord: 1.5, voicing: 3, steps: 5, pad: 0 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { release: 1.8, sustain: 7, body: 0.9, position: 0.14, volume: 2 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { pitch: 12, mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-rungs-of-ash',
    name: 'Rungs of ash',
    category: 'plucked',
    description:
      'Hollow thumb-piano plucks rise a step with each chord over tied strings, six to a chord, inside a wooden body.',
    preview: BREATH,
    maker: {
      makerId: 'one-spine',
      preset: 'Morning climb',
      params: { chord: 2, voicing: 3, pad: 0.5, common: 1 },
      parts: {
        pad: {
          deviceId: 'chamber-strings',
          preset: 'Whisper bows',
          params: { attack: 0.2, release: 0.7, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { chance: 0.05, volume: -1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } }],
  },
  {
    id: 'many-rooms-one-spine-skylight-opening',
    name: 'Skylight opening',
    category: 'pad',
    description:
      'Strings dim as each chord is held and start bright again on the next, a rising bass of four chords in full voicing.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Morning climb',
      params: { role: 0, chord: 2, voicing: 3 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.2, release: 1.1, volume: -3.5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.75, mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-joists-counted-upward',
    name: 'Joists, counted upward',
    category: 'bass',
    description:
      'A muted pick counts C D E F upward, a soft guitar strumming each chord once above it on the same beat.',
    preview: DETACHED,
    maker: {
      makerId: 'one-spine',
      preset: 'Morning climb',
      params: { role: 1, chord: 2, pad: 0.6 },
      parts: {
        pad: {
          deviceId: 'acoustic-guitar',
          preset: 'Lazy strum',
          params: { strum: 60, release: 1.2, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { mute: 0.2, release: 0.25, volume: -3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'many-rooms-one-spine-vane-above-the-attic',
    name: 'Vane above the attic',
    category: 'keys',
    description:
      'Short synth brass goes up each climbing chord from its root, four notes, wandering from side to side, a plain echo after it.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Morning climb',
      params: { chord: 2, steps: 4, voicing: 3, pad: 0 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { release: 0.35, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { depth: 0.7 } },
      { deviceId: 'echo-memory', preset: 'Plain echo', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-swifts-in-the-eaves',
    name: 'Swifts in the eaves',
    category: 'bell',
    description:
      'Edge tones of a pan sing the tops of a climb, falling first and then rising, over a bass clarinet that only climbs.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Morning climb',
      params: { role: 3, chord: 2, keys: 1, pad: 0, bass: 0.7 },
      parts: {
        bass: {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { attack: 0.08, volume: -2.5 },
        },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Edge overtones', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },

  // Pedal: the hearth, eight chords over one C.
  {
    id: 'many-rooms-one-spine-hearth-kept-in',
    name: 'Hearth kept in',
    category: 'pad',
    description:
      'Octaves of a still organ tone move through chords over one tonic, which a soft sub holds under a slow rotor.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Over one note',
      params: { chord: 2, voicing: 0, bass: 0.6 },
      parts: {
        bass: {
          deviceId: 'sub-bass',
          preset: 'Soft sub',
          params: { attack: 0.1, release: 0.6, volume: -20.5 },
        },
      },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: { attack: 0.15, release: 0.9, sub: 0, shape: 1, volume: -14 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.7 } }],
  },
  {
    id: 'many-rooms-one-spine-c-banked-for-the-night',
    name: 'C banked for the night',
    category: 'drone',
    description:
      'Open fifths on C glow under a small music box that breaks four chords over them, eight notes to each.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Over one note',
      params: { role: 4, chord: 1.5, steps: 8, bass: 0, arp: 0.6, voicing: 0 },
      parts: { arp: { deviceId: 'modal-bells', preset: 'Music box', params: { volume: -2.5 } } },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { attack: 0.5, release: 1.6, air: 0.05, volume: -3.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-two-hearths',
    name: 'Two hearths',
    category: 'pad',
    description:
      'Silver strings in open position over one held bass note; when the lowest key goes from C to A, the bass and the chords go along.',
    preview: TWO_HOMES,
    maker: {
      makerId: 'one-spine',
      preset: 'Over one note',
      params: { chord: 1.5, keys: 2, voicing: 1, bass: 0.6 },
      parts: {
        bass: {
          deviceId: 'bowed-string',
          preset: 'Still tone',
          params: { attack: 0.15, release: 0.7, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.2, release: 1.2, lowCut: 500, volume: -4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-poker-and-tongs',
    name: 'Poker and tongs',
    category: 'plucked',
    description:
      'A nylon guitar strums four-note chords over a C that is always the lowest string, one to a key, on a reel of tape.',
    preview: DETACHED,
    maker: {
      makerId: 'one-spine',
      preset: 'Over one note',
      params: { chord: 2, voicing: 3, bass: 0, common: 0 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { release: 2.5, strum: 70, volume: -8 },
    },
    effects: [{ deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.05 } }],
  },
  {
    id: 'many-rooms-one-spine-sparks-at-the-grate',
    name: 'Sparks at the grate',
    category: 'bell',
    description:
      'Glassy tines touch the top note of each chord over a tonic held by a low choir, with octave repeats hopping upward.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Over one note',
      params: { role: 3, chord: 1.5, bass: 0, drone: 0.6 },
      parts: {
        drone: {
          deviceId: 'choir',
          preset: 'Basses ah',
          params: { attack: 0.3, release: 0.8, volume: -9.5 },
        },
      },
    },
    instrument: { deviceId: 'tine-piano', preset: 'Glass bells', params: { volume: -7 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { feedback: 0.35, mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-iron-pot-over-the-fire',
    name: 'Iron pot over the fire',
    category: 'bell',
    description:
      'A folded gong an octave under rings once for each chord, with a harp going up and down the chord in fives.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Over one note',
      params: { role: 3, chord: 2, keys: 1, bass: 0, arp: 0.5, steps: 5 },
      parts: { arp: { deviceId: 'harp', preset: 'Near the soundboard', params: { volume: 6 } } },
    },
    instrument: { deviceId: 'west-coast', preset: 'Long gong', params: { decay: 3.5, volume: 2 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'many-rooms-one-spine-all-round-the-fire',
    name: 'All round the fire',
    category: 'pad',
    description:
      'Synth strings with a sub octave move over one bass on a pump organ, with a zither in sixes and pan pipes on top.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'All five',
      params: { spine: 7, chord: 2, steps: 6, common: 1, drone: 0, voicing: 1 },
      parts: {
        bass: {
          deviceId: 'organ',
          preset: 'Pump organ',
          params: { attack: 0.1, release: 0.5, volume: -11 },
        },
        arp: { deviceId: 'zither', preset: 'Koto pluck', params: { volume: -3 } },
        bell: { deviceId: 'flute', preset: 'Pan pipes', params: { volume: -12 } },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Octave below',
      params: { cutoff: 900, resonance: 0.2, attack: 0.3, release: 1.2, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { hiss: 0 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
  },

  // Rocking: the nursery, Dm7 to G and Fmaj7 to C.
  {
    id: 'many-rooms-one-spine-cradle-strummed-wide',
    name: 'Cradle, strummed wide',
    category: 'plucked',
    description:
      'A twelve-string rolls Dm7 and G by turns, the root lowest, one strum to two seconds, then lifts them into a haze.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Rocking boat',
      params: { role: 0, voicing: 3, chord: 2, bass: 0 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { release: 2, strum: 90, volume: -8 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { interval: 1, mix: 0.25 } },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { hiss: 0 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-a-mobile-over-the-cot',
    name: 'A mobile over the cot',
    category: 'keys',
    description:
      'Fast shimmering tines turn round Dm7 and G in sixes, root first; hold D after C and the pair rocks a step higher.',
    preview: STEP_UP,
    maker: {
      makerId: 'one-spine',
      preset: 'Rocking boat',
      params: { voicing: 3, steps: 6, chord: 2, bass: 0, keys: 2 },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { tremolo: 0.5, release: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Faint halo', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-blocks-on-the-rug',
    name: 'Blocks on the rug',
    category: 'plucked',
    description:
      'A slit drum an octave down knocks the outer notes of the rocking chords in fives, with altos behind it and an upright on D and G.',
    preview: LOW_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Rocking boat',
      params: { voicing: 4, steps: 5, chord: 2, bass: 0.6, keys: 1, pad: 0.5 },
      parts: {
        bass: {
          deviceId: 'string-bass',
          preset: 'Dark soft upright',
          params: { release: 0.4, volume: -5 },
        },
        pad: {
          deviceId: 'choir',
          preset: 'Altos eh',
          params: { attack: 0.15, release: 0.6, volume: -14 },
        },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Slit drum', params: { decay: 1.4, volume: -2 } },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo' }],
  },
  {
    id: 'many-rooms-one-spine-night-light-low',
    name: 'Night light, low',
    category: 'pad',
    description:
      'Soft square clarinets rock between two chords, softer as keys are let go, with a pure bass on D and G under them.',
    preview: SOFTER,
    maker: {
      makerId: 'one-spine',
      preset: 'Rocking boat',
      params: { role: 0, voicing: 0, chord: 2, bass: 0.6 },
      parts: {
        bass: { deviceId: 'fm-bass', preset: 'Soft sine', params: { release: 0.4, volume: -19.5 } },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.2, release: 1, volume: -12 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-nursery-band',
    name: 'Nursery band',
    category: 'bass',
    description:
      'A ringing upright rocks D G D G for three others: felt piano chords, a celesta in fours and an alto flute on top.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Rocking boat',
      params: { role: 1, voicing: 0, steps: 4, chord: 2, pad: 0.5, arp: 0.45, bell: 0.5 },
      parts: {
        pad: {
          deviceId: 'felt-piano',
          preset: 'Felt',
          params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -14 },
        },
        arp: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -1 } },
        bell: { deviceId: 'flute', preset: 'Alto flute', params: { release: 0.4, volume: -10.5 } },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { release: 0.4, sustain: 8, volume: 1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'many-rooms-one-spine-glass-rattle',
    name: 'Glass rattle',
    category: 'bell',
    description:
      'A frozen spectrum struck like glass sings the tops of the rocking chords, C D C D, its tail slowly drooping in pitch.',
    preview: BREATH,
    maker: { makerId: 'one-spine', preset: 'Rocking boat', params: { role: 3, chord: 2, bass: 0 } },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { attack: 0.005, release: 1.2, cutoff: 6000, volume: -3 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } }],
  },

  // Open road: the gatehouse, A F C G.
  {
    id: 'many-rooms-one-spine-gatehouse-band',
    name: 'Gatehouse band',
    category: 'plucked',
    description:
      'A steel guitar drives Am, F, C and G in eighths with a picked bass, string machine chords and a soft trumpet.',
    preview: BREATH,
    maker: {
      makerId: 'one-spine',
      preset: 'Open road',
      params: { role: 2, chord: 2, steps: 8 },
      parts: {
        pad: {
          deviceId: 'string-machine',
          preset: 'Ensemble strings',
          params: { attack: 0.15, release: 0.8, volume: -10.5 },
        },
        bass: { deviceId: 'string-bass', preset: 'Bright pick', params: { tone: 0.5, volume: -2 } },
        bell: {
          deviceId: 'horns',
          preset: 'Ballad trumpet',
          params: { attack: 0.08, release: 0.5, volume: -5.5 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { release: 1, sustain: 5, volume: -2.5 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'many-rooms-one-spine-dust-on-the-drive',
    name: 'Dust on the drive',
    category: 'pad',
    description:
      'Synth brass opening like a vowel holds each chord of the open road in full voicing, worn and warped as a record.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Open road',
      params: { role: 0, voicing: 3, chord: 2, bass: 0, arp: 0, bell: 0 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.5, release: 0.9, brilliance: 700, resonance: 0.5, volume: -12 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter', params: { crackle: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-spokes-going-by',
    name: 'Spokes going by',
    category: 'plucked',
    description:
      'A bright folded harp runs up and down Am, F, C and G twelve notes at a time, ghosted an octave below by slow tape.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Open road',
      params: { role: 2, voicing: 3, steps: 12, chord: 2, pad: 0, bass: 0, bell: 0 },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 1.2, fold: 0.35, volume: -8 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.22 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-milestones-in-the-verge',
    name: 'Milestones in the verge',
    category: 'bass',
    description:
      'A fretless marks A F C G with a long soft finger, a slow pedal steel on the two outer notes of each chord.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Open road',
      params: { role: 1, voicing: 4, chord: 2, pad: 0.5, arp: 0, bell: 0 },
      parts: { pad: { deviceId: 'pedal-steel', preset: 'Slow steel', params: { volume: -12 } } },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { release: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-poles-along-the-drive',
    name: 'Poles along the drive',
    category: 'keys',
    description:
      'A stopped pipe tone steps through the road chords in eights, an octave higher with each higher key, three pulses in eight louder.',
    preview: OCTAVES,
    maker: {
      makerId: 'one-spine',
      preset: 'Open road',
      params: { role: 2, voicing: 0, steps: 8, chord: 2, keys: 1, pad: 0, bass: 0, bell: 0 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { attack: 0.01, release: 0.25, cutoff: 1200, resonance: 0.5, volume: -1 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Canon of three', params: { rate: 4, floor: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'many-rooms-one-spine-carts-before-daylight',
    name: 'Carts before daylight',
    category: 'pad',
    description:
      'Fluttering vowels hold four road chords, a second and a half each, as a flock heard from across a room.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Open road',
      params: { role: 0, voicing: 1, chord: 1.5, bass: 0, arp: 0, bell: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Vowel flutter',
      params: { attack: 0.12, release: 0.8, cutoff: 3000, volume: -6 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Straight ahead' },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },

  // Fifths up: the lantern room at the top, F C G D A E.
  {
    id: 'many-rooms-one-spine-pan-in-the-lantern-room',
    name: 'Pan in the lantern room',
    category: 'bell',
    description:
      'A halo of steel strikes the top note of each chord a glass harp holds, as they climb by fifths, a second and a half each.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Rising fifths',
      params: { chord: 1.5, keys: 1, pad: 0.45 },
      parts: {
        pad: {
          deviceId: 'modal-bells',
          preset: 'Glass harp',
          params: { release: 0.5, volume: -12 },
        },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 4, volume: 1.5 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Nearly dry', params: { mix: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-horn-from-the-lantern',
    name: 'Horn from the lantern',
    category: 'wind',
    description:
      'A muted synth trumpet plays the top line of rising fifths, louder key by key, over held chords of a soft horn choir.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Rising fifths',
      params: { chord: 2, pad: 0.5, common: 1 },
      parts: {
        pad: {
          deviceId: 'horns',
          preset: 'Flugel choir',
          params: { attack: 0.2, release: 0.8, volume: -11 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { attack: 0.08, resonance: 0.5, release: 0.7, volume: -1 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 5, mix: 0.25 } }],
  },
  {
    id: 'many-rooms-one-spine-lens-turning',
    name: 'Lens, turning',
    category: 'keys',
    description:
      'A narrow pulse wave climbs rising fifths in fours, each note split into colours that arrive one after another.',
    preview: REFRAIN,
    maker: {
      makerId: 'one-spine',
      preset: 'Rising fifths',
      params: { role: 2, voicing: 2, steps: 4, chord: 1.5, pad: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { cutoff: 3500, release: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 300, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'many-rooms-one-spine-winding-gear',
    name: 'Winding gear',
    category: 'bass',
    description:
      'Driven tines on the roots of rising fifths, F C G D, through a warm stack; soft wooden bars climb each chord in threes.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Rising fifths',
      params: { role: 1, chord: 2, pad: 0, arp: 0.5, steps: 3 },
      parts: { arp: { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: -1 } } },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { drive: 0.5, release: 0.4, volume: -10 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { mix: 0.7 } }],
  },
  {
    id: 'many-rooms-one-spine-beam-over-the-roofs',
    name: 'Beam over the roofs',
    category: 'pad',
    description:
      'A thin saw pad takes its octave from the hand: the same rising fifths low, then an octave up, then two.',
    preview: OCTAVES,
    maker: {
      makerId: 'one-spine',
      preset: 'Your own octave',
      params: { chord: 2, voicing: 0, bass: 0, keys: 1 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin shimmer',
      params: { attack: 0.15, release: 1, cutoff: 3500, volume: -6 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-iron-stair-to-the-lamp',
    name: 'Iron stair to the lamp',
    category: 'plucked',
    description:
      'A bright pick runs rising fifths in tens, two seconds each, over the bass of a soft tuba, in a narrow ringing tunnel.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Your own octave',
      params: { role: 2, keys: 0, voicing: 1, steps: 10, chord: 2, bass: 0.7 },
      parts: {
        bass: {
          deviceId: 'horns',
          preset: 'Soft tuba',
          params: { attack: 0.08, release: 0.4, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { sustain: 4, release: 0.5, tone: 0.7, volume: -3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 2.5, mix: 0.25 } }],
  },

  // Narrow gate: the passage, E phrygian.
  {
    id: 'many-rooms-one-spine-all-along-the-passage',
    name: 'All along the passage',
    category: 'plucked',
    description:
      'Soft mallet tones break dark chords over E in fives with muted strings, a bowed bass and a bamboo flute on top.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Narrow gate',
      params: { role: 2, voicing: 0, steps: 5, chord: 2, drone: 0, pad: 0.5, bass: 0.7, bell: 0.5 },
      parts: {
        pad: {
          deviceId: 'chamber-strings',
          preset: 'Muted swell',
          params: { attack: 0.25, release: 0.8, volume: -14.5 },
        },
        bass: {
          deviceId: 'string-machine',
          preset: 'Bowed bass',
          params: { attack: 0.1, release: 0.6, volume: -4 },
        },
        bell: { deviceId: 'flute', preset: 'Shakuhachi', params: { release: 0.4, volume: -14.5 } },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 1.1, volume: -2 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'many-rooms-one-spine-cold-flagstones',
    name: 'Cold flagstones',
    category: 'drone',
    description:
      'Tuned air on C blows under chords that stand on E, which a soft harp plucks in threes; a breeze moves all of it.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Narrow gate',
      params: { role: 4, voicing: 0, chord: 1.5, steps: 3, arp: 0.6 },
      parts: { arp: { deviceId: 'harp', preset: 'Soft silk', params: { volume: -2.5 } } },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { attack: 0.5, release: 1.8, partials: 0.4, air: 0.5, volume: -13 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 2400 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-door-left-ajar',
    name: 'Door left ajar',
    category: 'pad',
    description:
      'Beating sines hold the outer notes of each chord alone; what two chords share is tied, so one voice moves at a time.',
    preview: ONE_KEY,
    maker: { makerId: 'one-spine', preset: 'Narrow gate', params: { chord: 1.5, drone: 0 } },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { attack: 0.15, release: 1.5, volume: -14.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 5, mix: 0.28 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-keyhole-bass',
    name: 'Keyhole bass',
    category: 'bass',
    description:
      'A slapped upright turned down to a murmur stands twice on E before F and D, with tremulant pipes on the chords.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Narrow gate',
      params: { role: 1, voicing: 0, chord: 1.5, drone: 0, common: 0, pad: 0.5 },
      parts: {
        pad: {
          deviceId: 'organ',
          preset: 'Tremulant flute',
          params: { attack: 0.1, release: 0.5, volume: -14.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { touch: 0.4, growl: 0.4, tone: 0.45, volume: 4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'many-rooms-one-spine-boots-in-the-passage',
    name: 'Boots in the passage',
    category: 'plucked',
    description:
      'A muted nylon string paces dark chords in sixteenths, two seconds to a chord, caught and dropped again by a tape loop of one second.',
    preview: DETACHED,
    maker: {
      makerId: 'one-spine',
      preset: 'Narrow gate',
      params: { role: 2, voicing: 0, steps: 16, chord: 2, drone: 0 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { sustain: 1, release: 0.2, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'One second round', params: { feedback: 0.4, mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'many-rooms-one-spine-gate-in-the-garden-wall',
    name: 'Gate in the garden wall',
    category: 'pad',
    description:
      'Still pipes hold dark chords over E for two seconds each, in close position, in a narrow tail that climbs by octaves.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Narrow gate',
      params: { voicing: 0, chord: 2, drone: 0, common: 0 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { attack: 0.12, release: 0.9, volume: -13 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Narrow fifth', params: { interval: 0, decay: 4, mix: 0.25 } },
    ],
  },

  // Bright sill: the sunroom, chords over F, lydian.
  {
    id: 'many-rooms-one-spine-sun-across-the-sill',
    name: 'Sun across the sill',
    category: 'plucked',
    description:
      'Hollow knocks run twelve to a chord through bright triads over a held F, which a soft reed keeps under them.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Bright sill',
      params: { chord: 2, common: 1, bass: 0.6 },
      parts: {
        bass: {
          deviceId: 'clarinet',
          preset: 'Subtone tenor',
          params: { attack: 0.1, release: 0.5, volume: -0.5 },
        },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { decay: 0.35, fm: 0.2, chance: 0.1, volume: 1.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-cushion-in-the-bay',
    name: 'Cushion in the bay',
    category: 'plucked',
    description:
      'A soft thumb keeps a low F under F, G, Am and G on steel strings, seven notes to each, louder key by key, as if next door.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Bright sill',
      params: { chord: 2, steps: 7, voicing: 0, bass: 0.55 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { strum: 0, release: 0.8, volume: 2.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.3 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-panes-of-the-sunroom',
    name: 'Panes of the sunroom',
    category: 'keys',
    description:
      'A glass table plucked short climbs the bright chords in eights, each note joined by pure tones an octave above it.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Bright sill',
      params: { chord: 2, steps: 8, voicing: 3, bass: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { attack: 0.006, release: 0.6, position: 0.8, sub: 0, volume: -3.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-curtains-breathing-in',
    name: 'Curtains breathing in',
    category: 'pad',
    description:
      'A saw through a ringing filter holds four bright triads over one bowed F while dry gusts pass over both.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Bright sill',
      params: { role: 0, chord: 1.5, voicing: 1, common: 1, bass: 0.5 },
      parts: {
        bass: {
          deviceId: 'bowed-string',
          preset: 'Soft flautando',
          params: { attack: 0.15, release: 0.7, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.2, release: 1.2, resonance: 0.6, cutoff: 1400, volume: -2.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Dry gusts', params: { mix: 0.5, voice: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-asleep-on-the-sill',
    name: 'Asleep on the sill',
    category: 'keys',
    description:
      'Underwater tines break bright chords in wide threes over one struck F, softer as keys are let go, a string pad growing in behind.',
    preview: SOFTER,
    maker: {
      makerId: 'one-spine',
      preset: 'Bright sill',
      params: { chord: 2, steps: 3, voicing: 2, common: 1, bass: 0.5 },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { release: 1, tone: 0.3, volume: -13 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'String pad', params: { mix: 0.3 } }],
  },
  {
    id: 'many-rooms-one-spine-sunroom-in-company',
    name: 'Sunroom in company',
    category: 'drone',
    description:
      'Octaves shimmer on C while triads pass on soft glass over a lightly bowed F; a small harp runs through them in eights.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Bright sill',
      params: {
        role: 4,
        chord: 1.5,
        steps: 8,
        voicing: 0,
        common: 1,
        pad: 0.5,
        bass: 0.6,
        arp: 0.5,
      },
      parts: {
        pad: {
          deviceId: 'fm-glass',
          preset: 'Crystal pad',
          params: { attack: 0.1, release: 0.8, volume: -24 },
        },
        bass: {
          deviceId: 'bowed-string',
          preset: 'Still tone',
          params: { attack: 0.15, release: 0.6, volume: -13 },
        },
        arp: { deviceId: 'harp', preset: 'Steel shimmer', params: { volume: -4.5 } },
      },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { attack: 0.3, release: 1.5, cutoff: 5000, air: 0.08, volume: -5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2, mix: 0.2 } },
    ],
  },

  // Stairs: the stairwell, a bass that comes down the whole scale.
  {
    id: 'many-rooms-one-spine-hand-along-the-rail',
    name: 'Hand along the rail',
    category: 'bass',
    description:
      'A bass near its bridge comes down C B A G F, a step every second and a half, with a soft figure of wooden bars in threes.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Stairs down',
      params: { chord: 1.5 },
      parts: { arp: { deviceId: 'modal-bells', preset: 'Wood bars', params: { volume: 6 } } },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { position: 0.14, tone: 0.55, release: 0.3, volume: -3 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-chime-on-the-landing',
    name: 'Chime on the landing',
    category: 'bell',
    description:
      'A pure tongue rings the top of each chord on the way down, over a tonic that deep organ pipes hold from the first floor to the last.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Bell tower',
      params: { chord: 2, keys: 1, bass: 0, common: 1, drone: 0.5 },
      parts: {
        drone: {
          deviceId: 'organ',
          preset: 'Deep pedal',
          params: { attack: 0.2, release: 0.8, volume: -22.5 },
        },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Pure tongue', params: { decay: 5, volume: -8 } },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 4, midDecay: 4, mix: 0.25 },
      },
    ],
  },
  {
    id: 'many-rooms-one-spine-echo-three-floors-up',
    name: 'Echo three floors up',
    category: 'bell',
    description:
      'Undamped tines touch the tops of a descending spine while a bass guitar walks down, and repeats follow in an uneven ladder.',
    preview: BREATH,
    maker: {
      makerId: 'one-spine',
      preset: 'Bell tower',
      params: { chord: 2, bass: 0.6, drone: 0 },
      parts: {
        bass: {
          deviceId: 'string-bass',
          preset: 'Thumb at the neck',
          params: { release: 0.3, volume: 1.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { release: 2, volume: -10 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Bent ladder', params: { span: 1500, mix: 0.3 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-down-past-the-coal',
    name: 'Down past the coal',
    category: 'bass',
    description:
      'A square wave with its sub comes down the whole scale in seven seconds, no chorus on it, filtered dark, its lows driven.',
    preview: SEVEN_STEPS,
    maker: { makerId: 'one-spine', preset: 'Stairs down', params: { chord: 1, arp: 0 } },
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: {
        sub: 0.4,
        cutoff: 500,
        envelope: 0.4,
        attack: 0.004,
        release: 0.2,
        chorus: 0,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'many-rooms-one-spine-drips-down-the-well',
    name: 'Drips down the well',
    category: 'bass',
    description:
      'A deep folded pulse steps down under two thin string notes of each chord, sunk a little way under water.',
    preview: SOFTER,
    maker: {
      makerId: 'one-spine',
      preset: 'Stairs down',
      params: { chord: 2, arp: 0, pad: 0.5, voicing: 4 },
      parts: {
        pad: {
          deviceId: 'chamber-strings',
          preset: 'Thin veil',
          params: { attack: 0.2, release: 0.8, volume: -8.5 },
        },
      },
    },
    instrument: { deviceId: 'west-coast', preset: 'Deep pulse', params: { volume: -4.5 } },
    effects: [{ deviceId: 'underwater', preset: 'A toe in' }],
  },
  {
    id: 'many-rooms-one-spine-metal-treads',
    name: 'Metal treads',
    category: 'bell',
    description:
      'Ring-tuned chime strings sound one top note for each step down, airy horns on the chords under them, all shimmering.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Bell tower',
      params: { chord: 1.5, bass: 0, drone: 0, pad: 0.5 },
      parts: {
        pad: {
          deviceId: 'horns',
          preset: 'Horn of air',
          params: { attack: 0.2, release: 0.6, volume: -9.5 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { ring: 0.7, release: 1.2, volume: -1 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-every-floor-at-once',
    name: 'Every floor at once',
    category: 'bass',
    description:
      'A warm bass guitar leads the band downstairs: vibraphone chords, a nylon guitar in fours, a soft ooh on the top notes.',
    preview: LOUDER,
    maker: {
      makerId: 'one-spine',
      preset: 'Stairs down',
      params: { chord: 2, steps: 4, arp: 0.5, pad: 0.45, bell: 0.5 },
      parts: {
        pad: { deviceId: 'mallets', preset: 'Motor vibes', params: { volume: -9 } },
        arp: {
          deviceId: 'acoustic-guitar',
          preset: 'Nylon dusk',
          params: { release: 0.6, strum: 0, volume: -1.5 },
        },
        bell: {
          deviceId: 'choir',
          preset: 'Boys ooh',
          params: { attack: 0.12, release: 0.6, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { release: 0.4, sustain: 8, volume: -4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0, wow: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Long stay: the guest wing, each root held for two colours.
  {
    id: 'many-rooms-one-spine-guest-wing-in-april',
    name: 'Guest wing in April',
    category: 'pad',
    description:
      'A slow bloom of synth brass turns Am into a ninth with no root, under a C that never moves, three seconds for each.',
    preview: ONE_KEY,
    maker: { makerId: 'one-spine', preset: 'Long stay', params: { chord: 3, voicing: 0, bell: 0 } },
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { attack: 0.6, release: 1.8, brilliance: 1000, volume: -9 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
  },
  {
    id: 'many-rooms-one-spine-trunks-still-locked',
    name: 'Trunks still locked',
    category: 'pad',
    description:
      'A thin pulse wave changes colour every four seconds and ties what two chords share; all eight last half a minute.',
    preview: LONG_KEY,
    maker: { makerId: 'one-spine', preset: 'Long stay', params: { chord: 4, voicing: 1, bell: 0 } },
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin voices',
      params: { attack: 0.7, release: 1.6, volume: -11 },
    },
    effects: [{ deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.25 } }],
  },
  {
    id: 'many-rooms-one-spine-no-talk-after-nine',
    name: 'No talk after nine',
    category: 'drone',
    description:
      'A harmonic series on a low C stays under chords of two colours each, sung by tenors who tie over what they share.',
    preview: DEEP_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Long stay',
      params: { role: 4, chord: 2, voicing: 0, keys: 1, bell: 0, pad: 0.6 },
      parts: {
        pad: {
          deviceId: 'choir',
          preset: 'Tenors oh',
          params: { attack: 0.2, release: 0.9, volume: -13.5 },
        },
      },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { attack: 0.5, release: 1.4, sub: 0.2, volume: -5.5 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Faint vowel' },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { decay: 3, mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-breakfast-for-everyone',
    name: 'Breakfast for everyone',
    category: 'bell',
    description:
      'A tank drum breaks each long-stayed chord in fours with a band: an accordion, a double bass and a clarinet on the tops.',
    preview: LOW_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Long stay',
      params: { role: 2, chord: 2, steps: 4, voicing: 0, keys: 1, pad: 0.5, bass: 0.7, bell: 0.5 },
      parts: {
        pad: {
          deviceId: 'organ',
          preset: 'Accordion',
          params: { attack: 0.1, release: 0.4, volume: -19.5 },
        },
        bass: { deviceId: 'string-bass', preset: 'Round upright', params: { volume: 3 } },
        bell: {
          deviceId: 'clarinet',
          preset: 'Open clarinet',
          params: { attack: 0.08, volume: -0.5 },
        },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Tank drum', params: { decay: 3.5, volume: -1 } },
    effects: [
      { deviceId: 'patina', preset: 'New tape', params: { noise: 0 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-letters-from-the-wing',
    name: 'Letters from the wing',
    category: 'bell',
    description:
      'A ringing overtone table sounds the top line of the long stay, C, F and E, the partials of each stroke stretched a little apart.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Long stay',
      params: { role: 3, chord: 1.5, voicing: 0, bell: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { attack: 0.01, motion: 0.4, resonance: 0.5, release: 1.2, volume: -4 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 8, mix: 0.25 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-bath-chairs-on-the-lawn',
    name: 'Bath chairs on the lawn',
    category: 'keys',
    description:
      'A reedy fluttering tine holds close chords and ties what they share, so the hammers strike only what is new.',
    preview: LONG_KEY,
    maker: { makerId: 'one-spine', preset: 'Long stay', params: { chord: 2, voicing: 0, bell: 0 } },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { hardness: 0.2, tone: 0.5, release: 0.5, tremolo: 0.3, volume: -15.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow drift', params: { mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { width: 0.6 } },
    ],
  },

  // Open fourths: the barn, no thirds in it.
  {
    id: 'many-rooms-one-spine-rafters-in-fourths',
    name: 'Rafters in fourths',
    category: 'plucked',
    description:
      'Folded reeds with a short gate step through chords with no third, five notes each, over the tonic on a wind harp.',
    preview: LONG_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Open fourths',
      params: { chord: 2, common: 1 },
      parts: {
        drone: { deviceId: 'wind-harp', preset: 'Still air', params: { release: 1, volume: -16 } },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { attack: 0.005, decay: 0.7, sustain: 0.1, volume: 1.5 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.22 } }],
  },
  {
    id: 'many-rooms-one-spine-flails-in-turn',
    name: 'Flails in turn',
    category: 'bass',
    description:
      'Hollow pipes take C G D A, the roots of open fourths, while a felted zither string breaks the chords above in sixes.',
    preview: SOFTER,
    maker: {
      makerId: 'one-spine',
      preset: 'Open fourths',
      params: { role: 1, chord: 2, drone: 0, arp: 0.5, steps: 6 },
      parts: { arp: { deviceId: 'zither', preset: 'Single felt string', params: { volume: -4 } } },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { attack: 0.06, decay: 1.2, sustain: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Light touch', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-barn-all-players',
    name: 'Barn, all players',
    category: 'keys',
    description:
      'Throbbing tines hold open fourths for a band: a round knocking bass, a koto-like harp in fives and a soft flute along the top.',
    preview: SOFTER,
    maker: {
      makerId: 'one-spine',
      preset: 'Open fourths',
      params: { role: 0, chord: 2, steps: 5, drone: 0, bass: 0.7, arp: 0.5, bell: 0.5 },
      parts: {
        bass: { deviceId: 'fm-bass', preset: 'Round knock', params: { release: 0.3, volume: -13 } },
        arp: { deviceId: 'harp', preset: 'Koto', params: { volume: -0.5 } },
        bell: {
          deviceId: 'flute',
          preset: 'Soft wind lead',
          params: { release: 0.4, volume: -14.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremolo: 0.6, release: 0.5, volume: -19.5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-knocking-at-the-hayloft',
    name: 'Knocking at the hayloft',
    category: 'bell',
    description:
      'Knuckles on a pan, an octave down, go up and down open fourths in threes, with slow loops of it coming round behind.',
    preview: LOW_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Open fourths',
      params: { chord: 1.5, steps: 3, keys: 1, drone: 0 },
    },
    instrument: { deviceId: 'handpan', preset: 'Knuckles', params: { touch: 0.6, volume: -1 } },
    effects: [
      { deviceId: 'orbits', preset: 'Faint trace', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'many-rooms-one-spine-fog-at-the-barn-doors',
    name: 'Fog at the barn doors',
    category: 'drone',
    description:
      'A suspended second hangs on the tonic under open chords on a rubbed bowl, a second and a half to each, all their edges blurred.',
    preview: ONE_KEY,
    maker: {
      makerId: 'one-spine',
      preset: 'Open fourths',
      params: { role: 4, chord: 1.5, common: 1, pad: 0.6, arp: 0, voicing: 1 },
      parts: {
        pad: {
          deviceId: 'modal-bells',
          preset: 'Rubbed bowl',
          params: { release: 0.6, volume: -18 },
        },
      },
    },
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: { attack: 0.5, release: 1.6, cutoff: 2200, volume: -8.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Pad softener', params: { mix: 0.7 } },
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.2 } },
    ],
  },
  {
    id: 'many-rooms-one-spine-low-in-the-cart-shed',
    name: 'Low in the cart shed',
    category: 'bass',
    description:
      'A dark reed wave with a strong sub plays the roots of open fourths, C G D A, with a few quiet organ stops added.',
    preview: BREATH,
    maker: {
      makerId: 'one-spine',
      preset: 'Open fourths',
      params: { role: 1, chord: 2, drone: 0 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Low bed',
      params: { attack: 0.03, release: 0.5, cutoff: 700, position: 0.4, sub: 0.6, volume: -12 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Nearly dry' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
]
