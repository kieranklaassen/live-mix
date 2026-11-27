import { type FactoryPreset } from '../types'

// Bronze Vowels says a word with what its partials have left as they die, so a
// preset here is first of all a word, the time it takes and who answers it. The
// rooms are kept behind the bell: too much of one blurs the vowel. Two presets
// stand in each of ten directions, one near the instrument's own sound and one
// as far from it as the direction goes.

export const BRONZE_VOWELS_PRESETS: readonly FactoryPreset[] = [
  // Temple syllables: a cast bell that says one word over many seconds.
  {
    id: 'bronze-vowels-temple-stone',
    name: 'Temple bell, stone floor',
    category: 'bell',
    description:
      'A temple bell struck with a hard felt head says ah, oh, oo in four and a half seconds over a stone floor.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Temple syllable', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.22 } }],
    preview: 'keys',
  },
  {
    id: 'bronze-vowels-raw-temple-valley',
    name: 'Home across the valley',
    category: 'bell',
    description:
      'A raw old bell with a wooden striker and slow beats says home and shuts its lips, far over an open valley.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Temple syllable',
      params: {
        volume: 5,
        word: 6,
        stray: 0.85,
        mallet: 1,
        hardness: 0.4,
        speak: 6,
        tract: -2,
        beat: 1.6,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air', params: { level: 0.95 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  // Felt keys: short wooden bars under a soft head.
  {
    id: 'bronze-vowels-felt-on-tape',
    name: 'Felt bars on tape',
    category: 'keys',
    description:
      'Wooden bars under felt, each saying ah, oh, oo in a second and a half, on quarter inch tape in a room.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Felt keys', params: { volume: -0.7 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'bronze-vowels-round-felt-tremor',
    name: 'Round keys that say we',
    category: 'keys',
    description:
      'A tuned body under soft felt says we on every key, from dark to bright, in a slow harmonic tremolo.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Felt keys',
      params: {
        volume: -0.5,
        metal: 0,
        stray: 0,
        word: 1,
        speak: 1.1,
        hardness: 0.22,
        ring: 14,
        sing: 0.55,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.2, depth: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.16 } },
    ],
  },
  // Plucked yes: a fingernail and a short word.
  {
    id: 'bronze-vowels-nail-echoes',
    name: 'Plucked yes, one echo',
    category: 'plucked',
    description:
      'A fingernail on a tuned body says we in under a second, low in the throat, with a clean echo behind.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Plucked yes' },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 380, feedback: 0.2, mix: 0.25 },
      },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'bronze-vowels-nay-nay-springs',
    name: 'Nay nay in the springs',
    category: 'plucked',
    description:
      'A fingernail on glass tuned to the key, opening and shutting its mouth twice in a second, in a spring tank.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Plucked yes',
      params: {
        volume: 2,
        metal: 4,
        word: 4,
        speak: 1.4,
        tract: 0,
        hardness: 0.2,
        clarity: 1,
        sing: 0.5,
        ring: 4,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
    ],
    preview: 'keys',
  },
  // Glass lullaby: long soft glass that learns its vowel from the last key.
  {
    id: 'bronze-vowels-glass-cradle',
    name: 'Glass cradle song',
    category: 'bell',
    description:
      'Soft glasses that beat slowly and come round to the vowel of the last one struck, with a faint octave glow.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Glass lullaby' },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'keys',
  },
  {
    id: 'bronze-vowels-glass-noon',
    name: 'Noon behind glass',
    category: 'pad',
    description:
      'Glasses that swell in over a second and say noon, half of it behind shut lips, blurred into a soft bed.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Glass lullaby',
      params: {
        volume: -1.8,
        word: 3,
        speak: 4,
        swell: 1.2,
        sing: 0.9,
        knock: 0,
        hum: 0.2,
        tract: 2,
        beat: 0.7,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  // Bass gong vowel: a plate low down, its mouth large.
  {
    id: 'bronze-vowels-gong-cellar',
    name: 'Gong in the cellar',
    category: 'bass',
    description:
      'A low plate under soft felt says home with a deep hum an octave below and comes up slowly in a dark cave.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Bass gong vowel', params: { volume: 1.6 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.18 } }],
  },
  {
    id: 'bronze-vowels-spoken-bass',
    name: 'Spoken bass, warm tape',
    category: 'bass',
    description:
      'A tuned body and its hum, fed by the key, say ay ma on every bass note and stop with the key, warm on tape.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Bass gong vowel',
      params: {
        metal: 0,
        stray: 0,
        hardness: 0.35,
        word: 5,
        speak: 1.1,
        tract: -2,
        sing: 1,
        release: 0.5,
        width: 0.4,
        hum: 0.6,
        wear: 0.2,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  // Sung bronze: held keys that sing.
  {
    id: 'bronze-vowels-sung-nave',
    name: 'Sung bronze in a nave',
    category: 'voice',
    description:
      'Bells fed for as long as the keys are down sing ah, oh, oo on the pure harmonics with breath, in a cathedral.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Sung bronze', params: { volume: -9.2 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  {
    id: 'bronze-vowels-low-hum-drone',
    name: 'Humming with shut lips',
    category: 'drone',
    description:
      "A giant's mouth hums on two low bells, lips closed and slowly beating, with strings that ring along in D minor.",
    instrument: {
      deviceId: 'bronze-vowels',
      preset: "Giant's hum",
      params: { volume: 2, tract: -5, swell: 1.5, knock: 0, air: 0.3, beat: 0.6, hum: 0.6 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 2, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
  // Answering bells: the ringing ones take the opposite vowel.
  {
    id: 'bronze-vowels-answer-wide',
    name: 'One says oo, one says ee',
    category: 'bell',
    description:
      'Every strike turns the ringing bells to the opposite vowel, each key at its own pace, spread wide in bright air.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Answering bells', params: { volume: -4.8 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.2 } }],
    preview: 'keys',
  },
  {
    id: 'bronze-vowels-answer-canon',
    name: 'Quarrel of small bells',
    category: 'keys',
    description:
      'Small high bells say nay nay against each other at their own pace, with tape echoes that join the quarrel.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Answering bells',
      params: {
        volume: 3.7,
        word: 4,
        speak: 1.2,
        tract: 5,
        stagger: 1,
        metal: 0,
        stray: 0.3,
        ring: 9,
        hum: 0,
        sing: 0.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } },
    ],
  },
  // Breath chime: no strike, only air.
  {
    id: 'bronze-vowels-breath-glass',
    name: 'Whoosh through glass',
    category: 'wind',
    description:
      'A breath wakes thin glass and says whoosh: air, a round oo, shut lips and air again, with an airy tail.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Breath chime' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.28 } }],
    preview: 'chord',
  },
  {
    id: 'bronze-vowels-hush-tide',
    name: 'Hush of the tide',
    category: 'texture',
    description:
      'Bells come up on a breath, whisper hush through a large mouth and draw back, with grains drifting off them.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Hushing tide',
      params: { swell: 2, speak: 4.5, air: 0.7 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thin veil' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  // Long amen: one word that takes most of the preview and more.
  {
    id: 'bronze-vowels-amen-hall',
    name: 'Sixteen second amen',
    category: 'pad',
    description:
      'A tuned chord swells in and says ay ma over sixteen seconds, low keys slowest, with slow tides in its colours.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Long amen', params: { volume: -1.2 } },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bronze-vowels-amen-low-fifth',
    name: 'Seem, then silence',
    category: 'drone',
    description:
      'A low fifth of cast bells that says seem over ten seconds, from bright ee to shut lips and back, on worn tape.',
    instrument: {
      deviceId: 'bronze-vowels',
      preset: 'Long amen',
      params: {
        metal: 3,
        word: 7,
        speak: 10,
        tract: 0,
        stagger: 0.3,
        wear: 0.35,
        swell: 0.8,
        clarity: 1,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.2 } },
    ],
  },
  // Dry wood word: bars, sticks and no tail.
  {
    id: 'bronze-vowels-dry-wood-room',
    name: 'Dry wood, small room',
    category: 'keys',
    description:
      'A stick on wooden bars says nay nay in under a second through a small mouth, close up in a tight chamber.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Dry wood word' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 7 } },
    ],
  },
  {
    id: 'bronze-vowels-talking-steel',
    name: 'Talking steel, two heads',
    category: 'plucked',
    description:
      'Cast metal that says ay ma twice a second while the key is down, all keys together, galloping off two tape heads.',
    instrument: { deviceId: 'bronze-vowels', preset: 'Talking metal', params: { volume: 1.6 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.12 } },
    ],
    preview: 'keys',
  },
]
