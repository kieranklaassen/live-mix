import { type FactoryPreset, type Phrase } from '../types'

// Melodies on the harmonics of one low string, pipe or throat, in their own tuning: the tunes use
// the sixth, eighth, ninth, tenth and twelfth over C or G, and the slow colours are the seventh,
// eleventh, thirteenth and fourteenth, which lie between the keys. The mouth holds one harmonic,
// the drone has them inside it, the wind lights them, the bow and the reed play them as a line.

// Six, eight, nine, ten and twelve over C: a scale by nature, above its own second and third harmonics.
const TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 6.2, note: 55.02, gain: 0.3 },
    { atSec: 0.3, durSec: 1, note: 72, gain: 0.55 },
    { atSec: 1.3, durSec: 0.6, note: 74.04, gain: 0.5 },
    { atSec: 1.9, durSec: 0.9, note: 75.86, gain: 0.55 },
    { atSec: 2.8, durSec: 1.1, note: 79.02, gain: 0.6 },
    { atSec: 3.9, durSec: 0.5, note: 75.86, gain: 0.5 },
    { atSec: 4.4, durSec: 0.5, note: 74.04, gain: 0.45 },
    { atSec: 4.9, durSec: 0.6, note: 67.02, gain: 0.45 },
    { atSec: 5.5, durSec: 0.9, note: 72, gain: 0.5 },
  ],
}
// The same five over G with the eleventh let in once, on the way from the tenth to the twelfth.
const G_SONG: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 55, gain: 0.28 },
    { atSec: 0.2, durSec: 0.9, note: 67, gain: 0.55 },
    { atSec: 1.1, durSec: 0.5, note: 69.04, gain: 0.5 },
    { atSec: 1.6, durSec: 0.9, note: 70.86, gain: 0.55 },
    { atSec: 2.5, durSec: 1.1, note: 72.51, gain: 0.6 },
    { atSec: 3.6, durSec: 0.9, note: 74.02, gain: 0.6 },
    { atSec: 4.5, durSec: 0.5, note: 70.86, gain: 0.5 },
    { atSec: 5, durSec: 0.5, note: 62.02, gain: 0.45 },
    { atSec: 5.5, durSec: 1.1, note: 67, gain: 0.5 },
  ],
}
// Eight sinks to seven and seven to six over C: two wide steps, a tone stretched by a sixth of a tone and a third drawn in.
const SEVEN_SINKS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 6.3, note: 55.02, gain: 0.3 },
    { atSec: 0.2, durSec: 1.5, note: 72, gain: 0.55 },
    { atSec: 1.7, durSec: 2.4, note: 69.69, gain: 0.6 },
    { atSec: 4.1, durSec: 2.2, note: 67.02, gain: 0.5 },
  ],
}
// G, then G sharp, then the eleventh harmonic of D that lies between those two keys, then home to A.
const TWO_FOURTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 50, gain: 0.4 },
    { atSec: 0.2, durSec: 1.2, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 1.2, note: 68, gain: 0.5 },
    { atSec: 2.8, durSec: 2, note: 67.51, gain: 0.62 },
    { atSec: 4.8, durSec: 1.6, note: 69.02, gain: 0.5 },
  ],
}
// Every rung from eight up to sixteen over G, each smaller than the one under it, with a stop on the eleventh, the thirteenth and the fourteenth.
const LADDER: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 6.8, note: 62.02, gain: 0.26 },
    { atSec: 0.2, durSec: 0.55, note: 67, gain: 0.5 },
    { atSec: 0.75, durSec: 0.55, note: 69.04, gain: 0.5 },
    { atSec: 1.3, durSec: 0.6, note: 70.86, gain: 0.5 },
    { atSec: 1.9, durSec: 0.95, note: 72.51, gain: 0.55 },
    { atSec: 2.85, durSec: 0.55, note: 74.02, gain: 0.5 },
    { atSec: 3.4, durSec: 0.95, note: 75.41, gain: 0.55 },
    { atSec: 4.35, durSec: 0.85, note: 76.69, gain: 0.55 },
    { atSec: 5.2, durSec: 0.45, note: 77.88, gain: 0.45 },
    { atSec: 5.65, durSec: 1.25, note: 79, gain: 0.5 },
  ],
}
// Pairs that skip one rung, 8 over 6, 9 over 7, 10 over 8, 11 over 9, 12 over 10, and home on 12 over 8.
const PAIRS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 55.02, gain: 0.5 },
    { atSec: 0, durSec: 1.1, note: 60, gain: 0.5 },
    { atSec: 1.1, durSec: 1.1, note: 57.69, gain: 0.5 },
    { atSec: 1.1, durSec: 1.1, note: 62.04, gain: 0.5 },
    { atSec: 2.2, durSec: 1, note: 60, gain: 0.5 },
    { atSec: 2.2, durSec: 1, note: 63.86, gain: 0.5 },
    { atSec: 3.2, durSec: 1.2, note: 62.04, gain: 0.55 },
    { atSec: 3.2, durSec: 1.2, note: 65.51, gain: 0.55 },
    { atSec: 4.4, durSec: 0.9, note: 63.86, gain: 0.5 },
    { atSec: 4.4, durSec: 0.9, note: 67.02, gain: 0.5 },
    { atSec: 5.3, durSec: 1.6, note: 60, gain: 0.5 },
    { atSec: 5.3, durSec: 1.6, note: 67.02, gain: 0.5 },
  ],
}
// Over a low C, the sixth, eighth and tenth step up to the seventh, ninth and eleventh, and then home.
const NATURE_CHORDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 36, gain: 0.4 },
    { atSec: 0, durSec: 2.1, note: 55.02, gain: 0.45 },
    { atSec: 0, durSec: 2.1, note: 60, gain: 0.45 },
    { atSec: 0, durSec: 2.1, note: 63.86, gain: 0.45 },
    { atSec: 2.1, durSec: 2.2, note: 57.69, gain: 0.45 },
    { atSec: 2.1, durSec: 2.2, note: 62.04, gain: 0.45 },
    { atSec: 2.1, durSec: 2.2, note: 65.51, gain: 0.45 },
    { atSec: 4.3, durSec: 2.3, note: 55.02, gain: 0.45 },
    { atSec: 4.3, durSec: 2.3, note: 60, gain: 0.45 },
    { atSec: 4.3, durSec: 2.3, note: 63.86, gain: 0.45 },
    { atSec: 4.3, durSec: 2.3, note: 67.02, gain: 0.4 },
  ],
}
// D, D and A held with the seventh left empty, then the seventh harmonic put in it and let down to the sixth.
const EMPTY_SEVENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 38, gain: 0.5 },
    { atSec: 0.2, durSec: 6.5, note: 50, gain: 0.38 },
    { atSec: 0.6, durSec: 6, note: 57.02, gain: 0.32 },
    { atSec: 1.8, durSec: 2.6, note: 71.69, gain: 0.4 },
    { atSec: 4.4, durSec: 2.2, note: 69.02, gain: 0.36 },
  ],
}
// Four, six, eight, ten and twelve over a low C laid one on another, and the fourteenth put on top.
const STRUM: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 48, gain: 0.6 },
    { atSec: 0.3, durSec: 6.1, note: 55.02, gain: 0.5 },
    { atSec: 0.65, durSec: 5.7, note: 60, gain: 0.5 },
    { atSec: 1.05, durSec: 5.2, note: 63.86, gain: 0.5 },
    { atSec: 1.6, durSec: 4.6, note: 67.02, gain: 0.5 },
    { atSec: 2.6, durSec: 3.4, note: 69.69, gain: 0.55 },
  ],
}
// One drone at a time, the eighth, the seventh, the sixth and the eighth again of a very low C: the blue step is in the bass.
const SEVEN_ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.75, note: 48, gain: 0.56 },
    { atSec: 1.75, durSec: 1.95, note: 45.69, gain: 0.58 },
    { atSec: 3.7, durSec: 1.3, note: 43.02, gain: 0.54 },
    { atSec: 5, durSec: 1.7, note: 48, gain: 0.54 },
  ],
}
// Eight, nine, ten, twelve and six sung low over a held C: each note carries its whistle the same step above it, so the mouth whistles the tune too.
const WHISTLE_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 36, gain: 0.4 },
    { atSec: 0.1, durSec: 1, note: 48, gain: 0.52 },
    { atSec: 1.1, durSec: 0.6, note: 50.04, gain: 0.5 },
    { atSec: 1.7, durSec: 0.9, note: 51.86, gain: 0.52 },
    { atSec: 2.6, durSec: 1.2, note: 55.02, gain: 0.56 },
    { atSec: 3.8, durSec: 0.5, note: 51.86, gain: 0.5 },
    { atSec: 4.3, durSec: 0.5, note: 50.04, gain: 0.48 },
    { atSec: 4.8, durSec: 0.8, note: 43.02, gain: 0.5 },
    { atSec: 5.6, durSec: 1.1, note: 48, gain: 0.5 },
  ],
}
// A bare fifth on D, held from end to end: what the mouth puts over it is the only melody.
const BARE_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 38, gain: 0.62 },
    { atSec: 0.9, durSec: 5.4, note: 45.02, gain: 0.45 },
  ],
}
// A low solo line over nothing: eight, seven, six, nine and eight on the harmonics of the C three octaves under middle C.
const LOW_REED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 60, gain: 0.5 },
    { atSec: 1.4, durSec: 1.9, note: 57.69, gain: 0.6 },
    { atSec: 3.3, durSec: 1.3, note: 55.02, gain: 0.5 },
    { atSec: 4.7, durSec: 0.7, note: 62.04, gain: 0.5 },
    { atSec: 5.4, durSec: 1.5, note: 60, gain: 0.5 },
  ],
}
// A round at a gap of 1.2 seconds: eight, nine; twelve, eleven; ten, seven; eight. Three voices meet on 8 10 12 and then on 7 9 11.
const ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 60, gain: 0.52 },
    { atSec: 0.7, durSec: 0.5, note: 62.04, gain: 0.48 },
    { atSec: 1.2, durSec: 0.7, note: 67.02, gain: 0.56 },
    { atSec: 1.9, durSec: 0.5, note: 65.51, gain: 0.52 },
    { atSec: 2.4, durSec: 0.7, note: 63.86, gain: 0.52 },
    { atSec: 3.1, durSec: 0.5, note: 57.69, gain: 0.52 },
    { atSec: 3.6, durSec: 0.95, note: 60, gain: 0.52 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'between-the-keys-eight-above-the-drone',
    name: 'Eight above the drone',
    category: 'voice',
    description:
      'A pressed throat with a narrow whistle that wanders round the eighth harmonic, no growl, in a bright hall.',
    preview: WHISTLE_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: {
        overtone: 8,
        focus: 0.95,
        wander: 0.6,
        pace: 0.5,
        growl: 0,
        vibrato: 0.1,
        attack: 0.3,
        release: 2.5,
        width: 0.7,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35, midDecay: 4 } },
    ],
  },
  {
    id: 'between-the-keys-rattle-in-the-chest',
    name: 'Rattle in the chest',
    category: 'drone',
    description:
      'A deep growling throat held on a broad fifth harmonic, pressed through an iron circuit and heard up a stone stair.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: {
        overtone: 5,
        focus: 0.5,
        wander: 0,
        growl: 0.85,
        breath: 0.05,
        attack: 0.2,
        release: 1.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.45 } },
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.3 } },
    ],
  },
  {
    id: 'between-the-keys-seven-held-over-d',
    name: 'Seven held over D',
    category: 'drone',
    description:
      'A wooden pipe whose mouth stays on the seventh harmonic and never moves, with a dark plate after it.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: {
        overtone: 7,
        focus: 0.8,
        wander: 0,
        growl: 0,
        vibrato: 0,
        breath: 0.15,
        attack: 0.8,
        release: 3,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.4, decay: 0.75 } },
    ],
  },
  {
    id: 'between-the-keys-eleven-leans-on-the-reed',
    name: 'Eleven leans on the reed',
    category: 'voice',
    description:
      'A lean reed with a sharp eleventh harmonic held over it, the sway coming late, and echoes of three tape heads behind.',
    preview: WHISTLE_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: {
        vibrato: 0,
        overtone: 11,
        focus: 0.9,
        wander: 0,
        growl: 0,
        breath: 0.1,
        attack: 0.1,
        release: 1.2,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 20 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3, feedback: 0.4 } },
    ],
  },
  {
    id: 'between-the-keys-eleven-in-a-warm-throat',
    name: 'Eleven in a warm throat',
    category: 'voice',
    description:
      'A soft throat on the eleventh harmonic with air in it, rising slowly, its tail climbing in fifths.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: {
        volume: -4,
        overtone: 11,
        focus: 0.6,
        wander: 0,
        breath: 0.45,
        growl: 0,
        attack: 0.9,
        release: 4,
        vibrato: 0.35,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.35, shimmer: 0.3, tone: 4500 } },
    ],
  },
  {
    id: 'between-the-keys-seven-in-the-gravel',
    name: 'Seven in the gravel',
    category: 'drone',
    description:
      'A half-growling throat held on the seventh harmonic, sounded inside a large hollow shell.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: {
        volume: -5.5,
        overtone: 7,
        focus: 0.65,
        wander: 0,
        growl: 0.6,
        attack: 0.4,
        release: 2,
        vibrato: 0.1,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Shell to the ear', params: { size: 2, mix: 0.6, air: 0.1 } },
    ],
  },
  {
    id: 'between-the-keys-jaw-harp-seventh-tongue',
    name: 'Jaw harp, seventh tongue',
    category: 'plucked',
    description:
      'A buzzing reed that stops on the seventh harmonic, quick to speak and quick to go, in a dripping spring.',
    preview: WHISTLE_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { volume: -13.5, overtone: 7, wander: 0, release: 0.6, focus: 0.85 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.35, drip: 0.6 } },
    ],
  },
  {
    id: 'between-the-keys-thirteen-mostly-air',
    name: 'Thirteen, mostly air',
    category: 'wind',
    description:
      'A breathy pipe on the thirteenth harmonic, its starts dissolved in a soft cloud with no tail.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: {
        volume: -4,
        overtone: 13,
        focus: 0.85,
        wander: 0,
        breath: 0.85,
        attack: 0.6,
        release: 2.5,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Deep fog', params: { size: 400, mix: 0.8 } }],
  },
  {
    id: 'between-the-keys-thirteen-turns-round',
    name: 'Thirteen turns round',
    category: 'voice',
    description:
      'A buzzing reed held on the thirteenth harmonic and sent through a slow turning horn and drum.',
    preview: WHISTLE_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: {
        volume: -4.5,
        overtone: 13,
        focus: 0.75,
        wander: 0,
        growl: 0.1,
        vibrato: 0,
        attack: 0.15,
        release: 1,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.85, drive: 0.15 } }],
  },
  {
    id: 'between-the-keys-fourteen-drifts-apart',
    name: 'Fourteen drifts apart',
    category: 'voice',
    description:
      'A throat held hard on the fourteenth harmonic, its bands swelling and drifting from side to side on their own clocks.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { overtone: 14, focus: 1, wander: 0, breath: 0.2, attack: 0.4, release: 3, width: 1 },
    },
    effects: [{ deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.7, rate: 0.2 } }],
  },
  {
    id: 'between-the-keys-fourteen-down-a-pipe',
    name: 'Fourteen down a pipe',
    category: 'wind',
    description:
      'A hollow pipe with the fourteenth harmonic clear above it, in a small bright tank of combs.',
    preview: WHISTLE_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: { overtone: 14, wander: 0, focus: 0.9, breath: 0.3, attack: 0.15, release: 1.5 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.45, decay: 3 } },
    ],
  },
  {
    id: 'between-the-keys-eleven-through-lips',
    name: 'Eleven through lips',
    category: 'drone',
    description:
      'A rough lip-buzzed pipe leaning broadly on the eleventh harmonic, through a combo amplifier with the microphone turned half away.',
    preview: WHISTLE_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { overtone: 11, focus: 0.45, growl: 0.7, attack: 0.08, release: 0.8 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.4, angle: 0.5, room: 0.5 },
      },
    ],
  },
  {
    id: 'between-the-keys-thirteen-takes-its-time',
    name: 'Thirteen takes its time',
    category: 'voice',
    description:
      'A throat on the thirteenth harmonic that takes nearly two seconds to open, in a great space that swells up after it.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: {
        overtone: 13,
        focus: 0.8,
        wander: 0,
        breath: 0.1,
        growl: 0.05,
        attack: 1.8,
        release: 6,
        vibrato: 0.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.45, decay: 14 } }],
  },
  {
    id: 'between-the-keys-fourteen-combed',
    name: 'Fourteen combed',
    category: 'texture',
    description:
      'A glassy reed on the fourteenth harmonic, swept by twelve slow stages so the note between the keys comes and goes.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { overtone: 14, focus: 0.7, attack: 0.3, release: 3, vibrato: 0.1, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.6, rate: 0.12 } },
    ],
  },
  {
    id: 'between-the-keys-plain-chest-voice',
    name: 'Plain chest voice',
    category: 'voice',
    description:
      'The soft second style: an open throat low on the fourth harmonic, no growl, thickened and left in a small room.',
    preview: WHISTLE_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: {
        overtone: 4,
        focus: 0.25,
        wander: 0,
        growl: 0,
        breath: 0.12,
        attack: 0.25,
        release: 1.2,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'between-the-keys-tongue-that-walks',
    name: 'Tongue that walks',
    category: 'plucked',
    description:
      'An airy plucked reed, its whistle hopping four times a second over the near harmonics, with repeats that hop by octaves.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { overtone: 8, wander: 0.9, breath: 0.35, pace: 4, release: 1.2, focus: 0.95 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { mix: 0.35, time: 375, feedback: 0.5 },
      },
    ],
  },
  {
    id: 'between-the-keys-pipe-left-on-the-hill',
    name: 'Pipe left on the hill',
    category: 'wind',
    description:
      'A breath-filled pipe that strays about the ninth harmonic, left outside in a dry gusting wind.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Air whistle',
      params: { voice: 1, overtone: 9, wander: 0.4, pace: 0.35, breath: 0.6, attack: 0.5 },
    },
    effects: [{ deviceId: 'weather', preset: 'Dry gusts', params: { exposure: 0.7, force: 0.5 } }],
  },
  {
    id: 'between-the-keys-sparks-off-the-whistle',
    name: 'Sparks off the whistle',
    category: 'voice',
    description:
      'A piercing throat whistle on the tenth harmonic that walks quickly and throws sparks an octave and a fifth higher.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: { overtone: 10, focus: 1, wander: 0.7, pace: 2, attack: 0.05, release: 1 },
    },
    effects: [{ deviceId: 'glints', preset: 'Fifths above', params: { mix: 0.35, density: 8 } }],
  },
  {
    id: 'between-the-keys-vowel-opens-and-shuts',
    name: 'Vowel opens and shuts',
    category: 'voice',
    description:
      'A broad vowel walking over all the near harmonics of an airy pipe, multiplied into a flock and sung on by low voices.',
    preview: BARE_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: {
        voice: 1,
        overtone: 6,
        focus: 0.12,
        wander: 1,
        pace: 0.6,
        breath: 0.55,
        attack: 0.9,
        release: 3,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'between-the-keys-stirrup-under-the-horn',
    name: 'Stirrup under the horn',
    category: 'drone',
    description:
      'A lip-buzzed pipe on its third harmonic with the octave below added, pressed on tape and narrowed to the middle.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { overtone: 3, focus: 0.6, growl: 0.4, attack: 0.1, release: 1, width: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { drive: 0.4 } },
    ],
  },
  {
    id: 'between-the-keys-seven-partials-of-c',
    name: 'Seven partials of C',
    category: 'drone',
    description:
      'The first seven partials as sines, the seventh left in its natural place, barely moving, narrow, over a sub and in a small dark room.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: {
        partials: 0.857,
        movement: 0.05,
        attack: 0.9,
        release: 1.6,
        sub: 0.6,
        air: 0.02,
        width: 0.1,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } }],
  },
  {
    id: 'between-the-keys-eight-partials-combed-in',
    name: 'Eight partials combed in',
    category: 'texture',
    description:
      'The whole row of eight partials in bright saws, a narrow resonance held on the eleventh harmonic of C.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        wave: 0.9,
        partials: 1,
        cutoff: 9000,
        attack: 0.5,
        release: 4,
        movement: 0.4,
        sub: 0,
      },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'One held note',
        params: { root: 0, octave: 2, low: 11, high: 11, focus: 0.8 },
      },
    ],
  },
  {
    id: 'between-the-keys-hollow-where-seven-goes',
    name: 'Hollow where seven goes',
    category: 'drone',
    description:
      'Open fifths over a deep sub, dark and slow, with the top rolled off so one line above can be heard in the gap.',
    preview: EMPTY_SEVENTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.35,
        wave: 0.3,
        cutoff: 700,
        sub: 0.8,
        air: 0,
        attack: 0.7,
        release: 3,
        movement: 0.3,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 2 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'between-the-keys-air-that-keeps-the-pitch',
    name: 'Air that keeps the pitch',
    category: 'texture',
    description:
      "Mostly air, filtered at each key's pitch over a bare sine, drawn out into one slow wash by long combs of reverb.",
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { volume: -19.5, attack: 0.8, release: 3, rate: 0.15, cutoff: 12000, movement: 0.6 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.5, decay: 8 } }],
  },
  {
    id: 'between-the-keys-just-third-beside-seven',
    name: 'Just third beside seven',
    category: 'pad',
    description:
      'A pure major shape in triangle tones, widened by copies fourteen cents either way, over a warm low shelf.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: {
        wave: 0.45,
        partials: 0.55,
        cutoff: 1800,
        attack: 0.9,
        release: 3,
        sub: 0.35,
        air: 0.1,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { detune: 14, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'between-the-keys-minor-shape-at-the-ford',
    name: 'Minor shape at the ford',
    category: 'drone',
    description:
      'A pure minor shape, buzzing and restless, sounded through a tall stopped pipe that favours the odd partials.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: {
        volume: -5,
        wave: 0.75,
        width: 0.2,
        attack: 0.3,
        release: 4,
        cutoff: 4200,
        movement: 0.8,
        rate: 0.3,
        sub: 0,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { body: 2, size: 1.5, mix: 0.75 } },
    ],
  },
  {
    id: 'between-the-keys-saws-in-the-dry-grass',
    name: 'Saws in the dry grass',
    category: 'texture',
    description:
      'Eight restless saws on one pitch, each band flickering on a small tremolo of its own, heard across open ground.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: { attack: 0.6, release: 2, cutoff: 7000, rate: 1.2 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.9, rate: 3 } },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.35 } },
    ],
  },
  {
    id: 'between-the-keys-hum-under-the-felt-tent',
    name: 'Hum under the felt tent',
    category: 'bass',
    description:
      'Almost a plain sine over its own octave below, rolled off above three hundred hertz and pressed into tape.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { attack: 0.4, release: 2, cutoff: 320, partials: 0.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { drive: 0.6 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 8 } },
    ],
  },
  {
    id: 'between-the-keys-octaves-breathing-in',
    name: 'Octaves breathing in',
    category: 'pad',
    description:
      'Octave partials high up with little weight, opened and shut by a slow cycle of breath.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { attack: 0.5, release: 2, rate: 0.2, cutoff: 6000, air: 0.1 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 1.4, out: 1.8, depth: 0.8, rest: 0.3 },
      },
    ],
  },
  {
    id: 'between-the-keys-cluster-leans-to-the-sun',
    name: 'Cluster leans to the sun',
    category: 'texture',
    description:
      'A cluster of just seconds, thirds and fourths pulled wide, its pitch sagging as it rings like warm wax.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: {
        volume: -5,
        partials: 1,
        attack: 0.6,
        release: 6,
        cutoff: 3200,
        air: 0.2,
        wave: 0.2,
      },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.6 } }],
  },
  {
    id: 'between-the-keys-seventh-kept-by-a-filter',
    name: 'Seventh kept by a filter',
    category: 'pad',
    description:
      'A bright row of partials let through most in narrow bands a quarter tone off the keys, so what lies between rings on.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { movement: 0.2, attack: 0.4, release: 2, air: 0.6, cutoff: 12000 },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'Between the keys', params: { depth: 18, ring: 1.5 } },
    ],
  },
  {
    id: 'between-the-keys-standing-partials-shake',
    name: 'Standing partials shake',
    category: 'drone',
    description:
      'Motionless low partials in the middle, trembling loud and soft five times a second.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { volume: -6, attack: 0.3, release: 1.5, partials: 0.7, cutoff: 2200 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Fast shudder', params: { rate: 5.2, depth: 0.7 } }],
  },
  {
    id: 'between-the-keys-second-over-the-note',
    name: 'Second over the note',
    category: 'pad',
    description:
      'A root, its just second and the fifth, swept by a slow comb that rises and folds over.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: {
        volume: 0.5,
        partials: 0.29,
        attack: 0.7,
        release: 3,
        cutoff: 6500,
        wave: 0.6,
        movement: 0.2,
      },
    },
    effects: [{ deviceId: 'flanger', preset: 'Rising comb', params: { mix: 0.5 } }],
  },
  {
    id: 'between-the-keys-nothing-but-the-octave',
    name: 'Nothing but the octave',
    category: 'organ',
    description:
      'Two sine octaves that start and stop with the key, with flute pipes an octave below and above and a hint of spring.',
    preview: TUNE,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: {
        shape: 1,
        partials: 0.15,
        attack: 0.06,
        release: 0.4,
        sub: 0,
        air: 0.08,
        movement: 0,
      },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'between-the-keys-quick-partials-at-noon',
    name: 'Quick partials at noon',
    category: 'organ',
    description:
      'Sine partials of the harmonic series that speak at once like a small pipe, through a light chorus and a close bright plate.',
    preview: G_SONG,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: {
        volume: -4.5,
        partials: 0.6,
        wave: 0.1,
        attack: 0.12,
        release: 0.6,
        sub: 0.1,
        air: 0.15,
        cutoff: 9000,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25, decay: 0.5 } },
    ],
  },
  {
    id: 'between-the-keys-beat-of-a-near-unison',
    name: 'Beat of a near unison',
    category: 'drone',
    description:
      'A swarm on one pitch moved by less than a hertz one way on the left and the other way on the right.',
    preview: BARE_D,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        hold: 0,
        partials: 0.5,
        wave: 0.6,
        attack: 0.5,
        release: 3,
        cutoff: 1200,
        movement: 0.2,
        sub: 0.6,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mode: 2, fine: 0.7, mix: 0.5 } },
    ],
  },
  {
    id: 'between-the-keys-glass-minor-tongued',
    name: 'Glass minor, tongued',
    category: 'pad',
    description:
      'A clear minor shape of sines in quick swells, each note answered from a scatter of points across the field.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: { attack: 0.05, release: 1.2, movement: 0.15 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.4, span: 1500 } },
    ],
  },
  {
    id: 'between-the-keys-radio-from-the-pass',
    name: 'Radio from the pass',
    category: 'texture',
    description:
      'Open fifths with a hard edge heard over a night link, the signal sinking into static and coming back.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { wave: 0.8, partials: 0.8, cutoff: 4500, attack: 0.6, release: 2, sub: 0 },
    },
    effects: [{ deviceId: 'radio', preset: 'Far station', params: { fading: 0.7, static: 0.3 } }],
  },
  {
    id: 'between-the-keys-sunk-under-the-river',
    name: 'Sunk under the river',
    category: 'drone',
    description:
      'Deep octaves near to saws, sunk under water with the tone wavering and a few bubbles rising.',
    preview: EMPTY_SEVENTH,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { attack: 0.8, release: 4, cutoff: 2400, sub: 0.4, wave: 0.7 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Under', params: { depth: 0.5, bubbles: 0.25 } }],
  },
  {
    id: 'between-the-keys-grain-of-the-sixth-rung',
    name: 'Grain of the sixth rung',
    category: 'texture',
    description:
      'A fifth shape broken into overlapping grains that drift an octave above the held tones.',
    preview: STRUM,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        attack: 0.25,
        release: 1.5,
        partials: 0.9,
        cutoff: 3500,
        movement: 0.1,
        wave: 0.05,
      },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { mix: 0.55, feedback: 0.3 } },
    ],
  },
  {
    id: 'between-the-keys-harp-on-the-river-bank',
    name: 'Harp on the river bank',
    category: 'plucked',
    description:
      'Four strings a key, plucked and then lit by a light wind, each with its near harmonics, with a faint tape echo and a short room.',
    preview: STRUM,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { wind: 0.3, glint: 0.55, ring: 5, release: 4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'between-the-keys-wind-finds-the-seventh',
    name: 'Wind finds the seventh',
    category: 'texture',
    description:
      'One string to a key in a steady wind set to the seventh harmonic of the low keys, with no pluck and no air, in a hall.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: {
        volume: -4,
        wind: 0.67,
        gust: 0,
        touch: 0,
        glint: 0.8,
        ring: 2,
        hum: 0.2,
        width: 0.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-gale-in-the-high-rungs',
    name: 'Gale in the high rungs',
    category: 'texture',
    description:
      'A strong wind that flashes the topmost harmonics of three strings, its ringing highs turned down as they come and the whole spread wide.',
    preview: NATURE_CHORDS,
    instrument: { deviceId: 'wind-harp', preset: 'High gale', params: { release: 1.5, air: 0.45 } },
    effects: [
      { deviceId: 'tamer', preset: 'Bright tail', params: { depth: 0.8 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'between-the-keys-hum-of-the-lee-side',
    name: 'Hum of the lee side',
    category: 'drone',
    description:
      "Out of the wind: the strings' own low notes nearly alone, rounded off and pressed warm by a triode.",
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { volume: -21.5, ring: 8, release: 3, glint: 0.15 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.5, tone: -0.5 } },
    ],
  },
  {
    id: 'between-the-keys-gust-up-gust-down',
    name: 'Gust up, gust down',
    category: 'texture',
    description:
      'One string a key and short ringing, so every gust runs up the harmonics and back, followed by itself an octave lower in canon.',
    preview: ROUND,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { volume: -2.5, touch: 0.3 },
    },
    effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.4, gap: 1.2 } }],
  },
  {
    id: 'between-the-keys-long-lull-on-the-plain',
    name: 'Long lull on the plain',
    category: 'pad',
    description:
      'Wind that drops away for seconds and lets the strings ring down, the quiet ends then brought up and lightly blurred.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Long lulls',
      params: { volume: -19.5, ring: 6, wind: 0.4, release: 4, touch: 0.35, hum: 0.3 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -28, amount: 0.8 } },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'between-the-keys-sea-wind-on-a-d-string',
    name: 'Sea wind on a D string',
    category: 'texture',
    description:
      'Breeze with more rush than string, each gust swelling and fading, moved round the head on a wander with the top taken off.',
    preview: EMPTY_SEVENTH,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Sea breeze',
      params: { volume: -3.5, air: 0.8, wind: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow wander', params: { rate: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'between-the-keys-soft-fingers-on-the-wire',
    name: 'Soft fingers on the wire',
    category: 'plucked',
    description:
      'A single damped pluck to each key with short harmonics after it, and one slack spring behind.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { volume: -6, ring: 0.8, release: 0.6, glint: 0.4 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.35 } }],
  },
  {
    id: 'between-the-keys-fourth-rung-shimmers',
    name: 'Fourth rung shimmers',
    category: 'pad',
    description:
      'Four strings a key tuned apart in an almost constant wind, bright and wide, rising into a halo an octave up.',
    preview: STRUM,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { gust: 0.1, ring: 8, release: 5, touch: 0.4 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.4, shimmer: 0.5 } }],
  },
  {
    id: 'between-the-keys-swell-from-the-valley',
    name: 'Swell from the valley',
    category: 'pad',
    description:
      'Very long ringing strings that come up with a slow gust, smeared so each chord dissolves slowly into the next.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { wind: 0.45, touch: 0.2, release: 3 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.6 } }],
  },
  {
    id: 'between-the-keys-fence-three-wires',
    name: 'Fence, three wires',
    category: 'texture',
    description:
      'Three rough strings to a key over their own low hum, ringing short in a strong wind, through a loudspeaker horn.',
    preview: LADDER,
    instrument: { deviceId: 'wind-harp', preset: 'Fence wires', params: { touch: 0.5, air: 0.05 } },
    effects: [{ deviceId: 're-amp', preset: 'Station platform', params: { mix: 0.7, room: 0.6 } }],
  },
  {
    id: 'between-the-keys-night-under-the-saddle',
    name: 'Night under the saddle',
    category: 'texture',
    description:
      'Air and faint strings in a wind that dies and returns, tucked behind glass and muffled.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { volume: -6.5, wind: 0.4, gust: 0.4, release: 3 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'between-the-keys-whistling-bottle-necks',
    name: 'Whistling bottle necks',
    category: 'wind',
    description:
      'One string to a key blown hard and high with no hum under it, sounded through a small bottle body.',
    preview: TUNE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { touch: 0.25, release: 1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.6, size: 0.6 } }],
  },
  {
    id: 'between-the-keys-plucks-sigh-a-third',
    name: 'Plucks sigh a third',
    category: 'plucked',
    description:
      'Clear plucks from one string a key; after each, long pieces of it sink about a minor third and fade.',
    preview: LADDER,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { touch: 1, wind: 0.1, ring: 1, glint: 0.9, release: 1.5 },
    },
    effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.45 } }],
  },
  {
    id: 'between-the-keys-pines-above-the-hum',
    name: 'Pines above the hum',
    category: 'pad',
    description:
      'Two strings a key in a moderate wind with the low note held under them, opened very wide above the bass in a hazy plate.',
    preview: STRUM,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { hum: 0.6, glint: 0.5, touch: 0.3, release: 4 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top', params: { high: 2, make: 0.9 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'between-the-keys-storm-loosens-strings',
    name: 'Storm loosens strings',
    category: 'texture',
    description:
      'Four strings to a key in rising and dying storm wind, with a thin copy at half speed, an octave down, behind.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Storm front',
      params: { volume: -7.5, gust: 0.7, ring: 9, touch: 0.5, air: 0.1, release: 3 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Thin shadow', params: { mix: 0.6 } }],
  },
  {
    id: 'between-the-keys-rung-after-rung-slowly',
    name: 'Rung after rung, slowly',
    category: 'bell',
    description:
      'Plucked strings with a long ring, each lighting a few low metal bowls tuned to fifths on G.',
    preview: LADDER,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -13.5, strings: 2, ring: 10, wind: 0.05, glint: 0.3, release: 6 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.4, root: 7 } }],
  },
  {
    id: 'between-the-keys-draught-at-the-lattice',
    name: 'Draught at the lattice',
    category: 'texture',
    description:
      'A faint wind over plain strings whose partials are stretched apart above the note, so no harmonic is in its place.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Still air',
      params: { hum: 0.3, wind: 0.3, touch: 0.4 },
    },
    effects: [{ deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.3, mix: 0.8 } }],
  },
  {
    id: 'between-the-keys-two-winds-one-harp',
    name: 'Two winds, one harp',
    category: 'pad',
    description:
      'Three plucked strings to a key in a fair wind, then what they played thrown backward in long chunks behind them.',
    preview: TUNE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { wind: 0.6, strings: 3, release: 2, ring: 3, width: 1 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Long mirror', params: { mix: 0.45 } }],
  },
  {
    id: 'between-the-keys-comb-of-nine-teeth',
    name: 'Comb of nine teeth',
    category: 'texture',
    description:
      'Strings in a level wind read by a voice of sines that redraws their nine strongest partials an octave up.',
    preview: PAIRS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { gust: 0.2, lull: 0, touch: 0.1, hum: 0.4, release: 2, glint: 1, wind: 0.35 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { partials: 9, mix: 0.6 } },
    ],
  },
  {
    id: 'between-the-keys-bow-on-the-seventh-node',
    name: 'Bow on the seventh node',
    category: 'string',
    description:
      'A dark full-bodied bow set a seventh of the way along, where the seventh harmonic falls silent, in a tall and slow hall.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: {
        position: 0.143,
        body: 0.85,
        attack: 0.8,
        release: 3,
        pressure: 0.35,
        vibrato: 0,
        detune: 3,
        brightness: 0.3,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-gut-at-the-eleventh-node',
    name: 'Gut at the eleventh node',
    category: 'plucked',
    description:
      'Dull short plucks an eleventh of the way along a gut-dark string, ringing in sympathy with strings on a G chord.',
    preview: LADDER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: {
        volume: -2,
        position: 0.091,
        decay: 2,
        brightness: 0.25,
        body: 0.8,
        detune: 0,
        release: 0.8,
      },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Open triad', params: { root: 7, mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-horsehair-hard-pressed',
    name: 'Horsehair, hard pressed',
    category: 'string',
    description:
      'A raspy bow close to the bridge with the pressure full on, its harsh ringing turned down, in a dark narrow spring.',
    preview: EMPTY_SEVENTH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        vibrato: 0,
        detune: 9,
        attack: 0.7,
        position: 0.06,
        body: 0.25,
        brightness: 0.7,
        release: 1,
      },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Harsh sample', params: { depth: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'between-the-keys-flautando-on-d-and-a',
    name: 'Flautando on D and A',
    category: 'string',
    description:
      'A bow with hardly any weight far over the string, hollow and soft, its tone sprayed into grains and warmed.',
    preview: EMPTY_SEVENTH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.5, release: 3, brightness: 0.1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Grain spray', params: { mix: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'between-the-keys-sustained-by-a-magnet',
    name: 'Sustained by a magnet',
    category: 'string',
    description:
      'A string held singing by its sustainer near the octave, bright and even, with a slow swirl and a single slap.',
    preview: TUNE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.35, release: 1.5, vibrato: 0.05, pressure: 0.7, detune: 2 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion', params: { mix: 1 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'between-the-keys-twelfth-over-the-bridge',
    name: 'Twelfth over the bridge',
    category: 'pad',
    description:
      'A thin sustained string with all its upper partials kept, with pipes a twelfth and two octaves up laid softly over it.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.6, release: 2.5, detune: 5 },
    },
    effects: [{ deviceId: 'stops', preset: 'Glass on top', params: { mix: 0.5 } }],
  },
  {
    id: 'between-the-keys-low-bow-open-strings',
    name: 'Low bow, open strings',
    category: 'string',
    description:
      'A heavy dark bow with all the body, its two strings apart by a wide slow beat and the octave under it swelling in.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.4,
        pressure: 0.4,
        brightness: 0.15,
        body: 1,
        detune: 14,
        release: 1.5,
        vibrato: 0,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { sub2: 0, sub1: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'between-the-keys-six-riders-one-bow',
    name: 'Six riders, one bow',
    category: 'string',
    description:
      'A section of wide vibrato bows turned into a flock of six who wheel about the listener.',
    preview: PAIRS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.15, release: 1, brightness: 0.5, vibrato: 0.8, vibratoRate: 5.5 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Wheeling', params: { birds: 6, mix: 0.6 } }],
  },
  {
    id: 'between-the-keys-ladder-in-plain-wire',
    name: 'Ladder in plain wire',
    category: 'plucked',
    description:
      'Bright wire plucked near the end and left ringing, each pluck coming back low colours first and high colours last.',
    preview: LADDER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -4.5, position: 0.05, decay: 6, brightness: 0.95, release: 3 },
    },
    effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-plucks-that-skip-away',
    name: 'Plucks that skip away',
    category: 'plucked',
    description:
      'Short damped plucks on a boxy body, each skipping off like a stone, closer and duller every time.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.2, decay: 1.5, position: 0.3 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.45 } }],
  },
  {
    id: 'between-the-keys-swelled-under-the-thumb',
    name: 'Swelled under the thumb',
    category: 'string',
    description:
      'A plucked string whose pick is faded out of it by a slow volume hand, its tones then held on by a soft strings bed.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: 3, attack: 0.35, release: 2, decay: 8 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 0.8, mix: 0.45 } }],
  },
  {
    id: 'between-the-keys-still-line-no-bow',
    name: 'Still line, no bow',
    category: 'pad',
    description:
      'A motionless sustained tone with no body, no brightness and one string, half redrawn as three sliding sines.',
    preview: SEVEN_SINKS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Sliding sines', params: { partials: 3, mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'between-the-keys-beats-beside-eleven',
    name: 'Beats beside eleven',
    category: 'plucked',
    description:
      'Two strings a quarter of a semitone apart, plucked at a third of their length and slowly beating, in a dim tape loop.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { volume: -1.5, decay: 8, position: 0.333, release: 4, brightness: 0.3 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.6, mix: 0.35 } }],
  },
  {
    id: 'between-the-keys-bow-turned-to-a-reed',
    name: 'Bow turned to a reed',
    category: 'string',
    description:
      'A quick bright sustainer with fast shallow vibrato, pressed into the shape of a hollow tube and pushed through a valve.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { attack: 0.08, vibrato: 0.15, pressure: 0.2 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 're-amp', preset: 'Just the valves', params: { drive: 0.35 } },
    ],
  },
  {
    id: 'between-the-keys-reel-of-the-long-bow',
    name: 'Reel of the long bow',
    category: 'string',
    description:
      'A bow at a middling weight on old reel tape: pressed, wavering in pitch and hissing a little.',
    preview: PAIRS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.12,
        brightness: 0.6,
        position: 0.2,
        pressure: 0.3,
        body: 0.5,
        release: 0.8,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.5, wear: 0.5 } },
    ],
  },
  {
    id: 'between-the-keys-slow-swell-low-sun',
    name: 'Slow swell, low sun',
    category: 'pad',
    description:
      'Wide beating sustained strings with the body left in, hung in a short fuzz and a long dark wall behind.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { volume: -12, attack: 1.2, release: 4, detune: 12 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.45 } }],
  },
  {
    id: 'between-the-keys-flageolet-over-the-herd',
    name: 'Flageolet over the herd',
    category: 'string',
    description:
      'A thin glassy bow near the bridge, sharp in colour, its echoes broken into grains and raised an octave.',
    preview: TUNE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: {
        attack: 0.15,
        release: 1,
        position: 0.03,
        brightness: 0.95,
        pressure: 0.3,
        body: 0,
        detune: 0,
      },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-cylinder-skips-the-evens',
    name: 'Cylinder skips the evens',
    category: 'wind',
    description:
      'A plain clarinet pipe, which keeps the odd harmonics and drops the even ones, close and nearly dry.',
    preview: G_SONG,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { bore: 0, blow: 0.4, breath: 0.1, attack: 0.08 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'between-the-keys-low-reed-seventh-held',
    name: 'Low reed, seventh held',
    category: 'wind',
    description:
      'A low soft reed with air round it, slow to speak, pushed through a tube, its echoes hopping by fourths and fifths.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { volume: 2, attack: 0.35, release: 1.2, blow: 0.3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.35 } },
      { deviceId: 'saturator', preset: 'Bass grit', params: { driveDb: 6 } },
    ],
  },
  {
    id: 'between-the-keys-apricot-reed-on-eleven',
    name: 'Apricot reed on eleven',
    category: 'wind',
    description:
      'A vocal reed held straight that opens late into a slow deep waver, in a long hall that sings a vowel.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 0.2, vibrato: 0, release: 0.9 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Opens to chorus', params: { depth: 35 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'between-the-keys-cone-with-every-rung',
    name: 'Cone with every rung',
    category: 'wind',
    description:
      'A bright conical pipe blown hard, so every harmonic is there, through an overdriven combo amplifier, out in the open.',
    preview: G_SONG,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.04, blow: 0.9, breath: 0.1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { mix: 0.6 } },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.5 } },
    ],
  },
  {
    id: 'between-the-keys-subtone-breath-first',
    name: 'Subtone, breath first',
    category: 'wind',
    description: 'More air than note, the air lifted and spread wide and the attacks softened.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { volume: -1, blow: 0.12, breath: 1, attack: 0.3, release: 1 },
    },
    effects: [{ deviceId: 'sift', preset: 'Wide air', params: { air: 6 } }],
  },
  {
    id: 'between-the-keys-reed-hum-sine-nearly',
    name: 'Reed hum, sine nearly',
    category: 'wind',
    description:
      'The purest hum the reed gives, hardly blown, with organ octaves above and below it that beat a little.',
    preview: G_SONG,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.25, release: 0.8 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Organ', params: { detune: 0.5 } }],
  },
  {
    id: 'between-the-keys-fluttered-at-fourteen',
    name: 'Fluttered at fourteen',
    category: 'wind',
    description:
      'A reed with the tongue rolling all through it, cut short, with six stages of slow swirl in a small tight room.',
    preview: LADDER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { volume: 5, attack: 0.06, release: 0.3 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'between-the-keys-reed-out-of-nothing',
    name: 'Reed out of nothing',
    category: 'pad',
    description:
      'A reed over its own drone that comes in air first and takes seconds to go, swelling into a shaped bloom of reverb.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { volume: -1, attack: 0.7, release: 3 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.5 } }],
  },
  {
    id: 'between-the-keys-reeds-in-a-round',
    name: 'Reeds in a round',
    category: 'wind',
    description:
      'A soft cone with steady wide vibrato, followed by two more of itself, each a little over a second after the last.',
    preview: ROUND,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { volume: -2, attack: 0.1, release: 0.5 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Round of three', params: { gap: 1.2, mix: 0.5, followers: 2 } },
    ],
  },
  {
    id: 'between-the-keys-growl-across-the-stream',
    name: 'Growl across the stream',
    category: 'wind',
    description:
      'A growling cone, blown rough and torn further by a pentode, heard from just under the water.',
    preview: TWO_FOURTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.9, attack: 0.08 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.5 } },
      { deviceId: 'underwater', preset: 'Just under', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'between-the-keys-open-air-open-reed',
    name: 'Open air, open reed',
    category: 'wind',
    description:
      'A bright open reed, loud and quick, and then the same phrase from a far bank a little over a second later.',
    preview: ROUND,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { volume: 5.5, vibrato: 0, blow: 1 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 1200, mix: 0.35, feedback: 0.2 },
      },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'between-the-keys-whisper-through-willow',
    name: 'Whisper through willow',
    category: 'wind',
    description:
      'A whispered reed, nearly all breath, only its steadiest tones kept and left hanging.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.3, release: 1.5, blow: 0.15 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.75 } }],
  },
  {
    id: 'between-the-keys-wide-sway-at-thirteen',
    name: 'Wide sway at thirteen',
    category: 'wind',
    description:
      'A half-conical reed with a very wide slow sway, doubled by its own near copies on two hung loops of unequal length.',
    preview: LADDER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { attack: 0.15, release: 0.6 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-tenor-over-the-ridge',
    name: 'Tenor over the ridge',
    category: 'wind',
    description:
      'A full cone that swells in over half a second and fades for seconds, climbing without end in a tail of gliding voices.',
    preview: PAIRS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 0.5, release: 3 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Rising hall', params: { mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-reed-and-worn-cassette',
    name: 'Reed and worn cassette',
    category: 'wind',
    description:
      'A hollow reed cut off short on a worn cassette, narrow, wobbling and noisy, under a thin veil of reverb.',
    preview: PAIRS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.75, breath: 0.2, attack: 0.03, release: 0.15 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'between-the-keys-reed-left-ringing',
    name: 'Reed left ringing',
    category: 'texture',
    description:
      'A slow-fading reed whose tones are frozen as it plays and held as an even, gliding bed of glass.',
    preview: LOW_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { volume: -0.5, release: 2, bore: 0.3, blow: 0.5 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Glass organ', params: { mix: 0.6, decay: 6 } }],
  },
  {
    id: 'between-the-keys-seventh-from-the-amp',
    name: 'Seventh from the amp',
    category: 'string',
    description:
      'A string pulled by feedback onto its seventh harmonic, clean, with hardly any pluck, in a long plate.',
    preview: BARE_D,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { distance: 7, bloom: 0.4, pick: 0.1, damp: 0.15, gain: 0.85 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'between-the-keys-pluck-caught-on-five',
    name: 'Pluck caught on five',
    category: 'plucked',
    description:
      'A hard pluck that the amplifier catches at once on the fifth harmonic, with ringing strings in sympathy.',
    preview: STRUM,
    instrument: {
      deviceId: 'feedback',
      preset: 'Edge of hold',
      params: { distance: 5, gain: 0.75, pick: 0.9, damp: 0.2 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.35 } }],
  },
  {
    id: 'between-the-keys-torn-string-at-dusk',
    name: 'Torn string at dusk',
    category: 'drone',
    description:
      'A string torn by its own amplifier, buzzing low, darkened by a slowly sweeping filter and put on cassette.',
    preview: SEVEN_ROOTS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Torn edge',
      params: { volume: -13.5, release: 1, pick: 0.3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Dub sweep', params: { cutoffHz: 900, lfoAmount: 25 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
  },
  {
    id: 'between-the-keys-two-rungs-fight-for-air',
    name: 'Two rungs fight for air',
    category: 'texture',
    description:
      'Two notes fighting over one amplifier, wandering between overtones, the middle pulsing three times a second in a slow chorus.',
    preview: PAIRS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Fighting chord',
      params: { volume: -2.5, bloom: 0.15, release: 0.6, wander: 0.8, width: 1 },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Three a second', params: { depth: 0.5 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'between-the-keys-hum-turns-into-eight',
    name: 'Hum turns into eight',
    category: 'pad',
    description:
      'No pluck: each note comes out of the hum and is pulled up towards its eighth harmonic, smeared to a glass halo.',
    preview: NATURE_CHORDS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { distance: 8, bloom: 0.3, release: 2, damp: 0.1 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.45 } }],
  },
  {
    id: 'between-the-keys-dark-string-sinks',
    name: 'Dark string sinks',
    category: 'drone',
    description:
      'A round dark string that holds its own note and sinks for seconds, in a black low well of short echoes.',
    preview: EMPTY_SEVENTH,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { volume: -4, bloom: 0.4, release: 6 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } }],
  },
  {
    id: 'between-the-keys-sixth-rung-drifting',
    name: 'Sixth rung, drifting',
    category: 'pad',
    description:
      'A string drifting between its fifth and seventh harmonics, its notes thrown off in slow tiles of octaves.',
    preview: TUNE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Drifting air',
      params: { volume: -2.5, distance: 6, bloom: 0.3, release: 1.5, wander: 0.9, grit: 0 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.4 } }],
  },
]
