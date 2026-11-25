import { type FactoryPreset, type Phrase } from '../types'

// Songs in the scales of their own metal: each struck body is played on the steps between its own
// partials (bowl, uncut bar, cut bar, glass, gong, and ice at three stiffnesses), from felt to hard
// mallets, rung open or stopped. Note numbers are fractional; the steps in the comments are in cents.

// A bowl on A in threes, every step and every note over A one of its consonances: 786, 1866, 1080, home, 619, 1405, 786, home.
const BOWL_SONG: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 57, gain: 0.8 },
    { atSec: 0.9, durSec: 0.85, note: 64.86, gain: 0.74 },
    { atSec: 1.35, durSec: 1.2, note: 75.66, gain: 0.65 },
    { atSec: 1.8, durSec: 1.2, note: 67.8, gain: 0.71 },
    { atSec: 2.7, durSec: 1.2, note: 57, gain: 0.8 },
    { atSec: 3.6, durSec: 0.8, note: 63.19, gain: 0.75 },
    { atSec: 4.05, durSec: 1.2, note: 71.05, gain: 0.69 },
    { atSec: 4.5, durSec: 1.2, note: 64.86, gain: 0.74 },
    { atSec: 5.4, durSec: 2, note: 57, gain: 0.8 },
  ],
}

// A bowl drone 786 cents under A, so partials 5.17 and 8.14 coincide, and a line that only takes steps the bowl and the drone both allow.
const BOWL_DUET: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 49.14, gain: 0.8 },
    { atSec: 3.6, durSec: 3.8, note: 49.14, gain: 0.68 },
    { atSec: 0.7, durSec: 1.1, note: 57, gain: 0.6 },
    { atSec: 1.6, durSec: 1.1, note: 63.19, gain: 0.6 },
    { atSec: 2.5, durSec: 1.1, note: 57, gain: 0.6 },
    { atSec: 3.4, durSec: 1.1, note: 67.8, gain: 0.55 },
    { atSec: 4.3, durSec: 1.1, note: 59.94, gain: 0.6 },
    { atSec: 5.2, durSec: 1.1, note: 67.8, gain: 0.52 },
    { atSec: 6.1, durSec: 1.3, note: 57, gain: 0.6 },
  ],
}

// Threes of bowls, no two notes of either anything but a consonance: 786 and 1866, then 619 and 1405, over one D.
const BOWL_TRIADS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 50, gain: 0.8 },
    { atSec: 0.4, durSec: 3.2, note: 57.86, gain: 0.68 },
    { atSec: 0.8, durSec: 2.8, note: 68.66, gain: 0.6 },
    { atSec: 3.7, durSec: 3.7, note: 50, gain: 0.8 },
    { atSec: 4.1, durSec: 3.3, note: 56.19, gain: 0.68 },
    { atSec: 4.5, durSec: 2.9, note: 64.05, gain: 0.6 },
  ],
}

// An uncut bar on D: a round at one note's distance, so each note is struck again under the next and every pair is 870, 1165 or 695.
const BAR_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 62, gain: 0.8 },
    { atSec: 0.62, durSec: 0.6, note: 70.7, gain: 0.73 },
    { atSec: 1.24, durSec: 0.6, note: 82.35, gain: 0.64 },
    { atSec: 1.86, durSec: 0.6, note: 73.65, gain: 0.71 },
    { atSec: 2.48, durSec: 0.6, note: 62, gain: 0.8 },
    { atSec: 3.1, durSec: 0.6, note: 68.95, gain: 0.74 },
    { atSec: 3.72, durSec: 0.6, note: 77.65, gain: 0.67 },
    { atSec: 4.34, durSec: 0.6, note: 70.7, gain: 0.73 },
    { atSec: 4.96, durSec: 0.6, note: 62, gain: 0.8 },
    { atSec: 0.62, durSec: 0.6, note: 62, gain: 0.45 },
    { atSec: 1.24, durSec: 0.6, note: 70.7, gain: 0.45 },
    { atSec: 1.86, durSec: 0.6, note: 82.35, gain: 0.45 },
    { atSec: 2.48, durSec: 0.6, note: 73.65, gain: 0.45 },
    { atSec: 3.1, durSec: 0.6, note: 62, gain: 0.45 },
    { atSec: 3.72, durSec: 0.6, note: 68.95, gain: 0.45 },
    { atSec: 4.34, durSec: 0.6, note: 77.65, gain: 0.45 },
    { atSec: 4.96, durSec: 0.6, note: 70.7, gain: 0.45 },
    { atSec: 5.58, durSec: 1.4, note: 62, gain: 0.45 },
  ],
}

// A small uncut bar, one line of even notes: each a partial step from the last (870, 1165, 870, 1165, 695, 870, 695, 870), so a follower one note late agrees.
const BAR_SONG: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.72, note: 70, gain: 0.8 },
    { atSec: 0.74, durSec: 0.72, note: 78.7, gain: 0.73 },
    { atSec: 1.48, durSec: 0.72, note: 90.35, gain: 0.6 },
    { atSec: 2.22, durSec: 0.72, note: 81.65, gain: 0.7 },
    { atSec: 2.96, durSec: 0.72, note: 70, gain: 0.8 },
    { atSec: 3.7, durSec: 0.72, note: 76.95, gain: 0.74 },
    { atSec: 4.44, durSec: 0.72, note: 85.65, gain: 0.66 },
    { atSec: 5.18, durSec: 0.72, note: 78.7, gain: 0.72 },
    { atSec: 5.92, durSec: 1.4, note: 70, gain: 0.8 },
  ],
}

// The same bar lower and held: five notes that each last into the next, 870 up, 1165 up, 870 down, 1165 down.
const BAR_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 50, gain: 0.8 },
    { atSec: 0.2, durSec: 3.4, note: 58.7, gain: 0.73 },
    { atSec: 1.8, durSec: 3.6, note: 70.35, gain: 0.6 },
    { atSec: 3.6, durSec: 3.6, note: 61.65, gain: 0.68 },
    { atSec: 5.4, durSec: 2, note: 50, gain: 0.8 },
  ],
}

// Glass rims in pairs: the upper stands on the second partial of the lower, 1457 up, and the next pair begins 1048 down from it.
const GLASS_STAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.15, note: 55, gain: 0.8 },
    { atSec: 0.5, durSec: 2.1, note: 69.57, gain: 0.6 },
    { atSec: 2.2, durSec: 2.15, note: 59.09, gain: 0.77 },
    { atSec: 2.7, durSec: 2.1, note: 73.66, gain: 0.6 },
    { atSec: 4.4, durSec: 2.9, note: 63.18, gain: 0.73 },
    { atSec: 4.9, durSec: 2.4, note: 77.75, gain: 0.57 },
  ],
}

// A glass on D, two closed rounds of its steps: 770, 1818, 1048, home, 601, 1371, 770, home.
const GLASS_RIMS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 62, gain: 0.8 },
    { atSec: 0.72, durSec: 1.6, note: 69.7, gain: 0.74 },
    { atSec: 1.44, durSec: 1.6, note: 80.18, gain: 0.65 },
    { atSec: 2.16, durSec: 1.6, note: 72.48, gain: 0.72 },
    { atSec: 2.88, durSec: 1.6, note: 62, gain: 0.8 },
    { atSec: 3.6, durSec: 1.6, note: 68.01, gain: 0.75 },
    { atSec: 4.32, durSec: 1.6, note: 75.71, gain: 0.69 },
    { atSec: 5.04, durSec: 1.6, note: 69.7, gain: 0.74 },
    { atSec: 5.76, durSec: 1.6, note: 62, gain: 0.8 },
  ],
}

// A gong on A, one stroke at a time: 949 up, 515 up, 949 down, with each still ringing under the next.
const GONG_STROKES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 45, gain: 0.8 },
    { atSec: 1.8, durSec: 2.6, note: 54.49, gain: 0.72 },
    { atSec: 3.6, durSec: 2.6, note: 59.64, gain: 0.68 },
    { atSec: 5.4, durSec: 2, note: 50.15, gain: 0.76 },
  ],
}

// A bar cut so its partials are 1, 4 and 10, long and short in turn: 770, 1807, 1037, home, then 1586 and the double octave, each from home.
const CUT_BAR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 53, gain: 0.8 },
    { atSec: 1, durSec: 0.8, note: 60.7, gain: 0.74 },
    { atSec: 1.5, durSec: 1.3, note: 71.07, gain: 0.66 },
    { atSec: 2.5, durSec: 0.8, note: 63.37, gain: 0.72 },
    { atSec: 3, durSec: 1.3, note: 53, gain: 0.8 },
    { atSec: 4, durSec: 0.8, note: 68.86, gain: 0.67 },
    { atSec: 4.5, durSec: 1.2, note: 53, gain: 0.78 },
    { atSec: 5.5, durSec: 0.8, note: 77, gain: 0.6 },
    { atSec: 6, durSec: 1.4, note: 53, gain: 0.8 },
  ],
}

// Cut wood, 1, 4 and 9.9: up the two octaves of its second partial, down 1569 so the third one meets it, again, and back the same way.
const WOOD_STAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 45, gain: 0.8 },
    { atSec: 0.72, durSec: 1.1, note: 69, gain: 0.61 },
    { atSec: 1.44, durSec: 1.1, note: 53.31, gain: 0.73 },
    { atSec: 2.16, durSec: 1.1, note: 77.31, gain: 0.54 },
    { atSec: 2.88, durSec: 1.1, note: 61.62, gain: 0.67 },
    { atSec: 3.6, durSec: 1.1, note: 77.31, gain: 0.54 },
    { atSec: 4.32, durSec: 1.1, note: 53.31, gain: 0.73 },
    { atSec: 5.04, durSec: 1.1, note: 69, gain: 0.61 },
    { atSec: 5.76, durSec: 1.6, note: 45, gain: 0.8 },
  ],
}

// The other bowl (blown, bowed, struck, plucked), whose modes lie a little elsewhere: 805, 1917, 1112 and home, each note held into the next, then 645.
const GBOWL_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.7, note: 57, gain: 0.8 },
    { atSec: 1.3, durSec: 2.7, note: 65.05, gain: 0.68 },
    { atSec: 2.6, durSec: 2.7, note: 76.17, gain: 0.57 },
    { atSec: 3.9, durSec: 1.6, note: 68.12, gain: 0.63 },
    { atSec: 5.2, durSec: 2.2, note: 57, gain: 0.8 },
    { atSec: 5.6, durSec: 1.8, note: 63.45, gain: 0.6 },
  ],
}

// The other bowl struck or plucked, two calls and a wait: 1112, 1917, 805, home, then 805, 1450, 645, home.
const GBOWL_SONG: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 60, gain: 0.8 },
    { atSec: 0.42, durSec: 0.5, note: 71.12, gain: 0.7 },
    { atSec: 0.84, durSec: 0.5, note: 79.17, gain: 0.62 },
    { atSec: 1.26, durSec: 0.5, note: 68.05, gain: 0.74 },
    { atSec: 1.68, durSec: 1.6, note: 60, gain: 0.8 },
    { atSec: 3.36, durSec: 0.5, note: 60, gain: 0.76 },
    { atSec: 3.78, durSec: 0.5, note: 68.05, gain: 0.72 },
    { atSec: 4.2, durSec: 0.5, note: 74.5, gain: 0.66 },
    { atSec: 4.62, durSec: 0.5, note: 66.45, gain: 0.73 },
    { atSec: 5.04, durSec: 2, note: 60, gain: 0.8 },
  ],
}

// Ice at its stiffest on E: 792, 1788, 997, home, 659, home, where its sharp partials meet.
const ICE_PLATE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 52, gain: 0.8 },
    { atSec: 0.95, durSec: 1.8, note: 59.92, gain: 0.74 },
    { atSec: 1.9, durSec: 1.8, note: 69.88, gain: 0.66 },
    { atSec: 2.85, durSec: 1.8, note: 61.97, gain: 0.72 },
    { atSec: 3.8, durSec: 1.8, note: 52, gain: 0.8 },
    { atSec: 4.75, durSec: 1.8, note: 58.59, gain: 0.75 },
    { atSec: 5.7, durSec: 1.7, note: 52, gain: 0.8 },
  ],
}

// Ice half as stiff on D, and so another scale: 811, 1441, 631, home, 531, 1162, home.
const ICE_HALF: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 50, gain: 0.8 },
    { atSec: 0.85, durSec: 1.7, note: 58.11, gain: 0.74 },
    { atSec: 1.7, durSec: 1.7, note: 64.41, gain: 0.68 },
    { atSec: 2.55, durSec: 1.7, note: 56.31, gain: 0.75 },
    { atSec: 3.4, durSec: 1.7, note: 50, gain: 0.8 },
    { atSec: 4.25, durSec: 1.7, note: 55.31, gain: 0.76 },
    { atSec: 5.1, durSec: 1.7, note: 61.62, gain: 0.71 },
    { atSec: 5.95, durSec: 1.45, note: 50, gain: 0.8 },
  ],
}

// Ice barely stiff on D, its octave 1227 wide: 746, 1301, 556, home, 455, 1011, 556, and home under its own wide octave.
const ICE_SLIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 50, gain: 0.8 },
    { atSec: 1.11, durSec: 0.9, note: 57.46, gain: 0.74 },
    { atSec: 1.48, durSec: 1.2, note: 63.01, gain: 0.68 },
    { atSec: 2.22, durSec: 1.2, note: 55.56, gain: 0.76 },
    { atSec: 2.96, durSec: 1.6, note: 50, gain: 0.8 },
    { atSec: 4.07, durSec: 0.9, note: 54.55, gain: 0.77 },
    { atSec: 4.44, durSec: 1.2, note: 60.11, gain: 0.72 },
    { atSec: 5.18, durSec: 1.1, note: 55.56, gain: 0.76 },
    { atSec: 5.92, durSec: 1.48, note: 50, gain: 0.8 },
    { atSec: 6.1, durSec: 1.3, note: 62.27, gain: 0.55 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'songs-in-bowl-tuning-felt-where-it-settles',
    name: 'Felt where it settles',
    category: 'bell',
    description:
      'A singing bowl struck with felt, its upper rim modes damped dull, then darkened and set on a dark plate.',
    preview: BOWL_SONG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        volume: -13,
        material: 1,
        stretch: 1,
        decay: 9,
        damping: 0.75,
        hardness: 0.02,
        position: 0.3,
        detune: 0.2,
        brightness: 0.1,
        release: 0.3,
        spread: 0.2,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { body: 3, air: -8, highCut: 2600 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.75, mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-leather-on-the-lip',
    name: 'Leather on the lip',
    category: 'bell',
    description:
      'A bowl hit hard at the very rim and choked on release, its low tone filtered thin, with a hint of spring behind.',
    preview: BOWL_SONG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        material: 1,
        stretch: 1,
        decay: 3.2,
        damping: 0.2,
        hardness: 0.85,
        position: 0,
        detune: 2.5,
        brightness: 0.85,
        release: 0.75,
        spread: 0.9,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { type: 1, cutoffHz: 330 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { decay: 1.4, mix: 0.22 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-rubbed-until-it-speaks',
    name: 'Rubbed until it speaks',
    category: 'pad',
    description:
      'Rubbed bowls held in threes a partial apart, each entry faded in over most of a second into a dark hall.',
    preview: BOWL_TRIADS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: {
        volume: -13,
        material: 1,
        stretch: 1,
        decay: 24,
        damping: 0.3,
        hardness: 0,
        detune: 0.5,
        sustain: 1,
        brightness: 0.45,
        release: 0.02,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 900 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { decay: 9, mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-drone-on-a-shared-mode',
    name: 'Drone on a shared mode',
    category: 'drone',
    description:
      'A long bowl with no beating, its strongest partials drawn again as sines that swell in and stay.',
    preview: BOWL_DUET,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: {
        material: 1,
        stretch: 1,
        decay: 40,
        damping: 0.35,
        hardness: 0.25,
        position: 0.1,
        detune: 0,
        brightness: 0.6,
        release: 0,
        spread: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Long linger',
        params: { partials: 12, attack: 900, release: 12, mix: 0.65 },
      },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-bowl-filled-to-the-brim',
    name: 'Bowl filled to the brim',
    category: 'bell',
    description:
      'A bowl with a quick beat, heard from just under water with a few bubbles, then off a drifting tape.',
    preview: BOWL_SONG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        material: 1,
        stretch: 1,
        decay: 6,
        damping: 0.6,
        hardness: 0.4,
        detune: 3.5,
        brightness: 0.4,
        release: 0.4,
        spread: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Sunlit shallows',
        params: { depth: 0.5, bubbles: 0.3, waver: 0.6 },
      },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { wow: 0.15, hiss: 0.05 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-rims-out-on-the-ridge',
    name: 'Rims out on the ridge',
    category: 'texture',
    description:
      'Half rubbed bowls beating six times a second, multiplied into a drifting flock and left out in the wind.',
    preview: BOWL_DUET,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: {
        material: 1,
        stretch: 1,
        decay: 16,
        hardness: 0.5,
        detune: 6.5,
        sustain: 0.6,
        brightness: 0.7,
        damping: 0.1,
        release: 0.1,
        spread: 0.8,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Slow drift', params: { birds: 9, mix: 0.6 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.5, voice: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-wet-finger-on-the-stair',
    name: 'Wet finger on the stair',
    category: 'pad',
    description:
      'Rubbed glass in pairs that climb, every attack blurred away in fog before an airy hall.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: {
        material: 5,
        stretch: 1,
        decay: 10,
        hardness: 0.02,
        detune: 0.8,
        sustain: 1,
        brightness: 0.2,
        release: 0.35,
        spread: 0.8,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 320 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-tumblers-in-their-racks',
    name: 'Tumblers in their racks',
    category: 'bell',
    description:
      'Short hard taps on glass, lows and top cut away, each thrown off as a quickening run of bouncing echoes.',
    preview: GLASS_RIMS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: {
        material: 5,
        stretch: 1,
        decay: 1.6,
        damping: 0.35,
        hardness: 1,
        position: 0,
        detune: 0.1,
        brightness: 1,
        release: 0.45,
        spread: 0.3,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 240 } },
      { deviceId: 'skipping-stone', preset: 'Ball on glass', params: { first: 260, mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-draught-along-the-shelf',
    name: 'Draught along the shelf',
    category: 'bell',
    description:
      'Glass split as far as it goes, its partials flickering one by one, in a thin space.',
    preview: GLASS_RIMS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: {
        volume: -5,
        material: 5,
        stretch: 1,
        decay: 7,
        damping: 0.05,
        hardness: 0.45,
        detune: 8,
        brightness: 0.8,
        release: 0.15,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer', params: { depth: 0.8 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 5, mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-heard-through-the-pane',
    name: 'Heard through the pane',
    category: 'bell',
    description: 'Dull, lightly rubbed glass moved into the next room and warmed by a hot valve.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: {
        material: 5,
        stretch: 1,
        decay: 14,
        damping: 0.85,
        hardness: 0.3,
        detune: 1.2,
        sustain: 0.3,
        brightness: 0.05,
        release: 0.2,
        spread: 0.3,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.55, room: 0.3 } },
      { deviceId: 'patina', preset: 'Valve bloom', params: { noise: 0.1, wear: 0.2 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-stroke-and-a-long-wait',
    name: 'Stroke and a long wait',
    category: 'bell',
    description:
      'A soft gong struck half way in, beating once a second and left to ring through a low cathedral.',
    preview: GONG_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        volume: -0.5,
        material: 6,
        stretch: 1,
        decay: 22,
        damping: 0.35,
        hardness: 0.2,
        position: 0.5,
        detune: 1,
        release: 0.05,
        brightness: 0.35,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 12, mix: 0.4 } }],
  },
  {
    id: 'songs-in-bowl-tuning-plate-turned-by-hand',
    name: 'Plate turned by hand',
    category: 'drone',
    description:
      'A gong rubbed without a stroke, its bands swelling and sinking on their own slow cycles.',
    preview: GONG_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: {
        volume: -14.5,
        material: 6,
        stretch: 1,
        decay: 30,
        hardness: 0.05,
        position: 0.6,
        detune: 0.4,
        sustain: 1,
        brightness: 0.25,
        release: 0.1,
        spread: 0.9,
      },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell', params: { rate: 0.25, depth: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clear: 0.6 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-gong-with-the-cloth-on',
    name: 'Gong with the cloth on',
    category: 'bell',
    description:
      'A gong damped to a short clank, played through a dark loudspeaker in a small room.',
    preview: GONG_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        material: 6,
        stretch: 1,
        decay: 1.8,
        damping: 0.95,
        hardness: 0.6,
        position: 0.1,
        detune: 0,
        brightness: 0.7,
        release: 0.8,
        spread: 0.2,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { drive: 0.3, distance: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-reel-kept-by-the-foundry',
    name: 'Reel kept by the foundry',
    category: 'bell',
    description:
      'A bright gong hit near its edge, put on a worn cassette and laid over itself by a fading loop.',
    preview: GONG_STROKES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        volume: -16,
        material: 6,
        stretch: 1,
        decay: 12,
        damping: 0.1,
        hardness: 0.75,
        position: 0.05,
        detune: 5,
        brightness: 0.9,
        release: 0.2,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.2, wear: 0.5 } },
      {
        deviceId: 'tape-loop',
        preset: 'Dark dissolve',
        params: { length: 2.4, feedback: 0.5, mix: 0.3 },
      },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-comb-of-an-uncut-box',
    name: 'Comb of an uncut box',
    category: 'plucked',
    description:
      'A music box comb of uncut bars, on an old fast record with light crackle and a small chamber.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        volume: 1.5,
        material: 3,
        stretch: 1,
        decay: 2.2,
        damping: 0.25,
        hardness: 0.7,
        position: 0.3,
        detune: 0,
        brightness: 0.45,
        release: 0.5,
        spread: 0.2,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { warp: 0.1, crackle: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-offcuts-on-sawhorses',
    name: 'Offcuts on sawhorses',
    category: 'plucked',
    description:
      'Dull wooden bars struck toward the middle, each pass of a short loop turning more to the tones of a room.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: {
        material: 3,
        stretch: 1,
        decay: 0.7,
        damping: 1,
        hardness: 0.2,
        position: 0.7,
        detune: 0,
        brightness: 0.15,
        release: 0.5,
        spread: 0.6,
      },
    },
    effects: [
      { deviceId: 'generations', preset: 'Small bright room', params: { length: 1.24, mix: 0.45 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-rods-over-the-kiln-door',
    name: 'Rods over the kiln door',
    category: 'bell',
    description:
      'Chime rods that ring on undamped, shaded at the top, with echoes that gather closer together.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: {
        volume: -2,
        material: 3,
        stretch: 1,
        decay: 14,
        damping: 0.02,
        hardness: 0.5,
        position: 0.15,
        detune: 1.6,
        brightness: 0.55,
        release: 0,
        spread: 0.7,
      },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Gathering in', params: { span: 1800, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5200 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-stair-cut-from-one-plank',
    name: 'Stair cut from one plank',
    category: 'plucked',
    description:
      'A soft marimba whose stair climbs by its own overtone, attacks blurred, in a dark hall.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.05, decay: 2.6, resonator: 0.9, width: 0.2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { size: 60, mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { lowDecay: 5, mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-rolled-below-the-breath',
    name: 'Rolled below the breath',
    category: 'pad',
    description:
      'A marimba rolled with soft yarn, the whole of it opened and closed by a slow breath and spread wide.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0, decay: 4, roll: 13, resonator: 1, width: 1 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.7 } },
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-knuckles-on-the-bench',
    name: 'Knuckles on the bench',
    category: 'plucked',
    description:
      'Short hard marimba strokes with little tube, half the sound through a narrow band, on a galloping tape echo.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: 6, mallet: 1, decay: 0.3, resonator: 0.1, damper: 0.6, width: 0.4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.35 } },
      { deviceId: 'auto-filter', preset: 'Phone line', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-hum-and-its-tenth',
    name: 'Hum and its tenth',
    category: 'plucked',
    description:
      'A humming marimba with a copy sixteen half steps above it, near the gap between two of its own overtones.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { mallet: 0.15, decay: 3, resonator: 1, width: 0.5 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { pitchA: 16, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-bars-left-in-the-rain',
    name: 'Bars left in the rain',
    category: 'plucked',
    description:
      'Marimba bars struck again and again in light rain, with a slow swirl passing over them.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -5, mallet: 0.45, decay: 0.8, resonator: 0.5, roll: 5, width: 0.8 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3, exposure: 0.6 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-motor-left-idling',
    name: 'Motor left idling',
    category: 'keys',
    description:
      'Soft vibraphone bars with the discs turning slowly and fully open and shut, a slow chorus after them.',
    preview: CUT_BAR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.1, decay: 2, motor: 1, motorRate: 1.5, width: 0.3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-palm-after-every-stroke',
    name: 'Palm after every stroke',
    category: 'keys',
    description:
      'Hard vibraphone strokes stopped as soon as they are let go, in a short gated room.',
    preview: CUT_BAR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.9, decay: 0.5, resonator: 0.2, damper: 1, width: 0.6 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch' },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.35, mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-upper-modes-come-forward',
    name: 'Upper modes come forward',
    category: 'keys',
    description:
      'A vibraphone without tubes, its quiet overtones turned up and its low tone thinned, on a bright plate.',
    preview: CUT_BAR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -4.5, mallet: 0.6, decay: 3.5, resonator: 0, damper: 0.1, width: 0.9 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.8, mix: 1 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { type: 1, cutoffHz: 420 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-fan-over-the-cut-bars',
    name: 'Fan over the cut bars',
    category: 'pad',
    description:
      'Rolled vibraphone with the motor fast, over a soft bed looped from what was just played, kept warm.',
    preview: CUT_BAR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: {
        volume: -16.5,
        mallet: 0.05,
        decay: 4,
        motor: 0.9,
        motorRate: 6.5,
        roll: 12,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 1.4, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3000 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-backs-of-the-bars',
    name: 'Backs of the bars',
    category: 'keys',
    description: 'Vibraphone bars mostly heard backwards in chunks, with a faint detuned halo.',
    preview: CUT_BAR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { mallet: 0.35, decay: 1.2, motor: 0, resonator: 0.6, width: 0.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards only', params: { time: 900, mix: 0.75 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-round-for-one-hand',
    name: 'Round for one hand',
    category: 'bell',
    description:
      'A muffled glockenspiel followed by itself at the unison three quarters of a second later, one note of its song.',
    preview: BAR_SONG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: -14.5, mallet: 0.15, decay: 3, resonator: 0.4, width: 0.2 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { followers: 1, gap: 0.74, interval1: 0, interval2: 0, fade: 0.2, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 4200 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-tubes-under-small-bars',
    name: 'Tubes under small bars',
    category: 'bell',
    description:
      'Long glockenspiel bars over open tubes that a motor throbs three times a second, in a warm hall.',
    preview: BAR_SONG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.3, decay: 4, resonator: 1, motor: 0.6, motorRate: 3, width: 0.7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-frost-along-the-comb',
    name: 'Frost along the comb',
    category: 'pad',
    description: 'A rolled glockenspiel with its attacks sifted out of a blurred halo.',
    preview: BAR_SONG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { volume: -12, mallet: 0.1, decay: 2, roll: 14, damper: 0.2, width: 1 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { blur: 0.75, mix: 0.8 } },
      { deviceId: 'sift', preset: 'Tones only' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-plates-put-away-quietly',
    name: 'Plates put away quietly',
    category: 'keys',
    description: 'A soft celesta that each time draws a reversed rise of reverb behind it.',
    preview: BAR_SONG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -7.5, mallet: 0.2, decay: 1, resonator: 1, damper: 0.3, width: 0.4 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { time: 1.4, mix: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-cabinet-after-midnight',
    name: 'Cabinet after midnight',
    category: 'keys',
    description: 'A short celesta out of a small clean radio, with a dark spring after it.',
    preview: BAR_SONG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { volume: -4.5, mallet: 0.5, decay: 0.5, resonator: 0.3, damper: 0.9, width: 0.1 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { mix: 0.8, fading: 0.2 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-told-again-by-lamplight',
    name: 'Told again by lamplight',
    category: 'keys',
    description:
      'A celesta with its low tone fluttering, moments of what was played drifting back over tape.',
    preview: BAR_SONG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { mallet: 0.05, decay: 2.2, motor: 0.8, motorRate: 6, damper: 0.4, width: 0.8 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.45 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-pair-of-unequal-rods',
    name: 'Pair of unequal rods',
    category: 'bell',
    description: 'Two dark metal bars to each key, beating three times a second, on a dark plate.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Four a second',
      params: {
        volume: -4.5,
        bar: 0,
        beat: 3,
        mallet: 0.2,
        decay: 9,
        tone: 0.2,
        damp: 0.1,
        ears: 0.4,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3400 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-one-swell-two-ears',
    name: 'One swell, two ears',
    category: 'pad',
    description:
      'Long dark bars with the stroke faded out, one bar an ear, breathing slowly in a vast nave.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: { volume: -4.5, bar: 0, beat: 0.6, mallet: 0, decay: 20, tone: 0.05, ears: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 700, retrigger: 0 } },
      { deviceId: 'breath', preset: 'Long slow sigh', params: { depth: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-struck-and-stopped',
    name: 'Struck and stopped',
    category: 'plucked',
    description:
      'Hard bright bars stopped on release, pushed a little by a limiter, with a quick spring.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Eight, hard',
      params: { bar: 0, beat: 8, mallet: 1, decay: 1.2, damp: 1, tone: 0.9, ears: 0.2 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-late-by-a-hand-width',
    name: 'Late by a hand width',
    category: 'bell',
    description:
      'The second bar of each pair lands forty milliseconds late, and the echo unfolds it from low to high.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Scattered metal',
      params: {
        volume: -2.5,
        bar: 0,
        beat: 5,
        scatter: 40,
        mallet: 0.55,
        decay: 5,
        tone: 0.5,
        damp: 0.3,
      },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 700, mix: 0.5 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-rough-pair-on-brown-tape',
    name: 'Rough pair on brown tape',
    category: 'bell',
    description:
      'Two bars seventeen hertz apart, driven into tape until they growl, then worn thin.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Twenty, rough',
      params: { bar: 0, beat: 17, mallet: 0.35, decay: 4, tone: 0.35, ears: 0.1 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -8 } },
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.15, wow: 0.1 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-drawn-again-in-sines',
    name: 'Drawn again in sines',
    category: 'drone',
    description:
      'Metal pairs of which only the ten strongest partials remain, each a slow pure sine.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: {
        volume: -6,
        bar: 0,
        beat: 1.3,
        mallet: 0.15,
        decay: 16,
        tone: 0.7,
        ears: 1,
        damp: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Glass redraw',
        params: { partials: 10, attack: 500, release: 3, mix: 1 },
      },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-middle-of-the-bar-pulses',
    name: 'Middle of the bar pulses',
    category: 'bell',
    description:
      'Long bars pulsing six times a second above four hundred hertz while the low tones hold, in a late hall.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { bar: 0, beat: 2, mallet: 0.4, decay: 12, tone: 0.55, damp: 0.2, ears: 0.6 },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        preset: 'Six a second',
        params: { depth: 0.85, low: 400, high: 3200 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-at-the-stretched-sixth',
    name: 'At the stretched sixth',
    category: 'bell',
    description:
      'Metal pairs with a copy nine half steps above, near where the third partial of one meets the fourth of the other.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Seven, paired',
      params: { volume: -3.5, bar: 0, beat: 4, mallet: 0.6, decay: 7, damp: 0.15, tone: 0.45 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { pitchA: 9, mix: 0.45 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 6, mix: 0.35, breathDepth: 0.2 },
      },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-bars-without-their-blows',
    name: 'Bars without their blows',
    category: 'pad',
    description:
      'Bright bars faded in over more than a second and lightly hazed, thickened by a wide ensemble.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Seven, paired',
      params: {
        volume: -3,
        bar: 0,
        beat: 1.8,
        mallet: 0.8,
        decay: 14,
        damp: 0.05,
        tone: 0.85,
        ears: 0.8,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 1200, retrigger: 0, mix: 1 } },
      { deviceId: 'fog', preset: 'Bright haze', params: { size: 400 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-rims-laid-in-pairs',
    name: 'Rims laid in pairs',
    category: 'pad',
    description:
      'Two glass rims a key that beat under once a second, muffled, with a reverb that hardly empties.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass bowl',
      params: {
        volume: -13,
        bar: 2,
        beat: 0.8,
        mallet: 0,
        decay: 20,
        tone: 0.1,
        ears: 0.6,
        damp: 0.05,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1800 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-carried-round-the-table',
    name: 'Carried round the table',
    category: 'bell',
    description: 'Glass pairs moved round the listener in a slow circle, with short clean repeats.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow sway',
      params: {
        volume: -6,
        bar: 2,
        beat: 0.5,
        ears: 0.3,
        mallet: 0.3,
        decay: 6,
        tone: 0.45,
        damp: 0.25,
      },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-cup-set-on-its-saucer',
    name: 'Cup set on its saucer',
    category: 'plucked',
    description:
      'Very short bright glass taps inside a body the size of a thimble, with one slap of tape.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Damped glass',
      params: { volume: 0.5, bar: 2, beat: 6, mallet: 1, decay: 0.6, damp: 1, tone: 1, ears: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble', params: { mix: 0.5 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-glass-stair-at-noon',
    name: 'Glass stair at noon',
    category: 'bell',
    description:
      'Bright glass pairs, their overtones glinting suddenly one at a time, in a bright hall.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { bar: 2, beat: 3, mallet: 0.9, decay: 10, tone: 0.95, damp: 0.1, ears: 0.9 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints', params: { depth: 0.9 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-beneath-the-bathwater',
    name: 'Beneath the bathwater',
    category: 'pad',
    description:
      'Glass beating ten times a second in the air, sunk deep under water in a dark cave.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Ten in the air',
      params: { bar: 2, beat: 10, mallet: 0.2, decay: 7, damp: 0.1, tone: 0.3 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Deep water', params: { depth: 0.75, bubbles: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5, mix: 0.35 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-what-both-rims-share',
    name: 'What both rims share',
    category: 'drone',
    description:
      'Glass pairs let through only where a partial was already sounding half a second ago, so shared ones hang on.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass, middle',
      params: { bar: 2, beat: 2, mallet: 0.5, decay: 14, tone: 0.7, damp: 0, ears: 0 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Only what stays',
        params: { ago: 500, ring: 0.75, mix: 1 },
      },
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-climbing-the-rim-step',
    name: 'Climbing the rim step',
    category: 'bell',
    description:
      'Short glass whose repeats climb 770 cents each time, a step between two of its own partials.',
    preview: GLASS_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Twelve, glass',
      params: { volume: -0.5, bar: 2, beat: 7, mallet: 0.6, decay: 2.5, damp: 0.6, tone: 0.6 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { pitch: 7.7, pitchSpray: 0, time: 520, feedback: 0.5, mix: 0.45 },
      },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-grain-of-the-long-plank',
    name: 'Grain of the long plank',
    category: 'pad',
    description:
      'Two soft wooden bars a key, their hum raised as it dies and wrapped in a woolly haze.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: {
        volume: -18,
        bar: 1,
        beat: 2,
        mallet: 0,
        tone: 0.05,
        decay: 7,
        damp: 0.05,
        ears: 1,
      },
    },
    effects: [
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.4, octave: 0 } },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-peg-knocked-home',
    name: 'Peg knocked home',
    category: 'plucked',
    description: 'A short wooden knock with a tight swarm of echoes, pushed forward and levelled.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood knock',
      params: {
        volume: -3,
        bar: 1,
        beat: 12,
        mallet: 0.6,
        tone: 0.75,
        decay: 1,
        damp: 0.8,
        ears: 0.6,
      },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { low: -4 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-flam-folded-over',
    name: 'Flam folded over',
    category: 'plucked',
    description:
      'A wooden flam between the ears, laid over itself by a short tape loop under a slow low-pass.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: {
        volume: -1,
        bar: 1,
        beat: 3,
        scatter: 35,
        mallet: 0.4,
        decay: 2,
        tone: 0.35,
        ears: 1,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'One second round',
        params: { length: 1.5, feedback: 0.65, mix: 0.5 },
      },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 1400 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-moth-at-the-wood-shelf',
    name: 'Moth at the wood shelf',
    category: 'plucked',
    description:
      'Wood fluttering fourteen times a second, shimmered again and read through an early sampler.',
    preview: WOOD_STAIR,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Ten, wood in air',
      params: { volume: 4, bar: 1, beat: 14, ears: 0, mallet: 0.6, decay: 3, tone: 0.6, damp: 0.3 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 6, depth: 0.8 } },
      { deviceId: 'patina', preset: 'Early sampler', params: { noise: 0.05, mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-breath-along-cold-iron',
    name: 'Breath along cold iron',
    category: 'wind',
    description:
      'A metal bar kept sounding by a lot of soft breath, dull and far off in a cathedral.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: {
        body: 2,
        pressure: 0.25,
        air: 0.9,
        bright: 0.25,
        swell: 0.5,
        release: 1.5,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { midDecay: 5, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-reed-against-the-edge',
    name: 'Reed against the edge',
    category: 'wind',
    description:
      'A bar blown hard like a reed, thin and close, a slow notch moving through it before a warm spring.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: {
        body: 2,
        pressure: 0.95,
        air: 0.1,
        bright: 0.8,
        swell: 0.02,
        release: 0.15,
        position: 0.1,
        wander: 0.05,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { mix: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-bow-drawn-off-the-end',
    name: 'Bow drawn off the end',
    category: 'string',
    description:
      'A bar bowed lightly with a slow start, ringing long and bright into an open space.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: {
        body: 2,
        pressure: 0.3,
        swell: 1.4,
        decay: 16,
        release: 10,
        bright: 0.95,
        air: 0.02,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9, mix: 0.35 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-rosin-and-rust',
    name: 'Rosin and rust',
    category: 'string',
    description:
      'A heavy, scraping bow on a dull bar, close and unsteady through an amplifier in a room.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: {
        volume: -17,
        body: 2,
        pressure: 0.9,
        swell: 0.1,
        decay: 1,
        release: 0.3,
        bright: 0.15,
        air: 0.8,
        wander: 0.5,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-edge-tone-held-as-mist',
    name: 'Edge tone held as mist',
    category: 'pad',
    description: 'A bowed bar heard only as a blur, every partial hanging on until the next.',
    preview: BAR_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: {
        body: 2,
        pressure: 0.5,
        position: 0.5,
        swell: 0.3,
        bright: 0.5,
        decay: 6,
        release: 3,
        width: 0.6,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { blur: 0.85, mix: 1 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-struck-once-on-brass',
    name: 'Struck once on brass',
    category: 'bell',
    description:
      'A metal bar struck firmly and left to ring bright, with three tape heads answering.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bar',
      params: { body: 2, pressure: 0.7, bright: 1, decay: 14, release: 10, air: 0.02, width: 1 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 310, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-knock-taken-away',
    name: 'Knock taken away',
    category: 'plucked',
    description:
      'A soft wood bar with the strike sifted out, so only the hum enters, behind a hazy plate.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck wood bar',
      params: {
        volume: -2,
        body: 2,
        pressure: 0.25,
        bright: 0.3,
        decay: 2.5,
        release: 1.5,
        air: 0.05,
        width: 0.4,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Bowed entries', params: { attacks: -30 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-thud-inside-the-pipe',
    name: 'Thud inside the pipe',
    category: 'plucked',
    description:
      'A dead, heavy strike on a bar with the thud of the mallet in it, sounding inside a pipe.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bar',
      params: {
        volume: -0.5,
        body: 2,
        pressure: 1,
        bright: 0.05,
        decay: 0.5,
        release: 0.2,
        air: 1,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { size: 1.8, mix: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-nail-at-the-very-end',
    name: 'Nail at the very end',
    category: 'plucked',
    description:
      'A bar plucked at its very end with a scrape of the nail, thinned out, skipping twice.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked bar',
      params: {
        body: 2,
        pressure: 0.4,
        position: 0,
        bright: 0.95,
        decay: 5,
        release: 3,
        air: 0.6,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Two skips', params: { first: 420, mix: 0.35 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { type: 1, cutoffHz: 300 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-pegs-turning-out-of-step',
    name: 'Pegs turning out of step',
    category: 'plucked',
    description:
      'A dull bar plucked in the middle, caught by loops of unequal length that turn against each other.',
    preview: BAR_ROUND,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked bar',
      params: {
        body: 2,
        pressure: 0.8,
        position: 0.5,
        bright: 0.2,
        decay: 1.2,
        release: 0.8,
        air: 0.1,
        width: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Out of step',
        params: { length: 1.24, feedback: 0.75, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-breath-laid-in-the-bowl',
    name: 'Breath laid in the bowl',
    category: 'pad',
    description:
      'A bowl blown so gently that it takes a second to speak, blooming in a long space.',
    preview: GBOWL_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: {
        body: 3,
        pressure: 0.15,
        air: 0.6,
        bright: 0.6,
        swell: 1.3,
        decay: 18,
        release: 8,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14, mix: 0.45 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-blown-over-short-wave',
    name: 'Blown over short wave',
    category: 'wind',
    description:
      'A bowl overblown with a great deal of air, heard from a far station with a late dark spring.',
    preview: GBOWL_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: { body: 3, pressure: 0.85, air: 1, bright: 0.4, swell: 0.08, release: 0.5, decay: 2 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Far station', params: { static: 0.2, mix: 0.9 } },
      { deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-side-to-side-on-one-lung',
    name: 'Side to side on one lung',
    category: 'wind',
    description: 'A narrow blown bowl that wanders from side to side and sways with the tape.',
    preview: GBOWL_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: {
        body: 3,
        pressure: 0.5,
        air: 0.2,
        bright: 0.9,
        swell: 0.25,
        release: 1.2,
        decay: 5,
        width: 0.1,
        wander: 0.6,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 0.7, depth: 0.9 } },
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.25, flutter: 0.2 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-catgut-on-the-rim',
    name: 'Catgut on the rim',
    category: 'string',
    description: 'A bright bowed bowl, a ripple rising through its partials over a bright plate.',
    preview: GBOWL_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: {
        body: 3,
        pressure: 0.55,
        swell: 0.35,
        bright: 1,
        air: 0.3,
        decay: 8,
        release: 2,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.75 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-slow-rim-dull-bow',
    name: 'Slow rim, dull bow',
    category: 'drone',
    description: 'A bowl bowed with weight and no rosin noise, dull, glowing in a low, fuzzy haze.',
    preview: GBOWL_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: {
        body: 3,
        pressure: 0.7,
        swell: 1,
        bright: 0.1,
        air: 0,
        decay: 5,
        release: 4,
        position: 0.5,
        width: 0.9,
      },
    },
    effects: [{ deviceId: 'haze', preset: 'Low rumble', params: { octave: 0, mix: 0.4 } }],
  },
  {
    id: 'songs-in-bowl-tuning-bowed-toward-itself',
    name: 'Bowed toward itself',
    category: 'pad',
    description: 'A light bow on a bowl answered by its own sound run backwards, very wide.',
    preview: GBOWL_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: { body: 3, pressure: 0.2, swell: 0.6, bright: 0.7, air: 0.05, decay: 12, release: 6 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 1200, mix: 0.6 } },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-bowl-and-its-inner-step',
    name: 'Bowl and its inner step',
    category: 'bell',
    description:
      'A struck bowl with two copies 805 and 795 cents above, round the gap between its third and fourth modes.',
    preview: GBOWL_SONG,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        volume: -11.5,
        body: 3,
        pressure: 0.6,
        bright: 0.9,
        decay: 16,
        release: 12,
        air: 0.02,
        width: 0.7,
      },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth',
        params: { pitchA: 8, pitchB: 8, detune: 5, mix: 0.4 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-cracked-bowl-kept',
    name: 'Cracked bowl, kept',
    category: 'bell',
    description: 'A short dead strike on a bowl with the mallet thudding, off a dusty record.',
    preview: GBOWL_SONG,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        volume: -2,
        body: 3,
        pressure: 0.9,
        bright: 0.2,
        decay: 0.9,
        release: 0.4,
        air: 0.7,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { warp: 0.15, crackle: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-plucked-then-slowed',
    name: 'Plucked, then slowed',
    category: 'texture',
    description: 'A plucked bowl mostly heard as its own slow stretched cloud.',
    preview: GBOWL_SONG,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        body: 3,
        exciter: 3,
        pressure: 0.5,
        bright: 0.6,
        decay: 4,
        release: 2,
        air: 0.3,
        width: 0.8,
      },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.75 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-fingernail-heirloom',
    name: 'Fingernail heirloom',
    category: 'plucked',
    description:
      'A thin bright pluck on a bowl with a scrape in it, flickers of earlier notes coming back.',
    preview: GBOWL_SONG,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        volume: 0.5,
        body: 3,
        exciter: 3,
        pressure: 0.3,
        bright: 1,
        decay: 2,
        release: 1,
        air: 0.9,
        position: 0.1,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.4 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { type: 1, cutoffHz: 260 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-sheet-struck-at-its-edge',
    name: 'Sheet struck at its edge',
    category: 'bell',
    description:
      'A fully stiff sheet of ice struck close by, its sharp partials ringing long on a plate.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: {
        volume: -1.5,
        stretch: 1,
        distance: 0.05,
        ring: 14,
        thick: 0.25,
        crack: 0.05,
        shore: 0,
        cracks: 0,
        bright: 0.5,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-scale-from-over-the-lake',
    name: 'Scale from over the lake',
    category: 'bell',
    description:
      'Stiff ice struck far off, a low slow chirp falling onto each note of the scale, in a far hall.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Far crack',
      params: {
        stretch: 1,
        distance: 1,
        bright: 0.25,
        ring: 3,
        thick: 0.5,
        shore: 0,
        cracks: 0,
        crack: 0,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-thickest-plate-of-all',
    name: 'Thickest plate of all',
    category: 'drone',
    description: 'Thick stiff ice with its body an octave down, dark and long, with murky repeats.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Thick ice',
      params: {
        volume: -10,
        stretch: 1,
        distance: 0.2,
        bright: 0,
        ring: 24,
        thick: 1,
        crack: 0,
        shore: 0.1,
        cracks: 0,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 900, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-splinters-in-order',
    name: 'Splinters in order',
    category: 'plucked',
    description:
      'Short thin snaps on the stiff scale, each throwing off a tight cluster of echoes, squeezed level.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: {
        volume: 6,
        stretch: 1,
        distance: 0,
        ring: 2.2,
        thick: 0.1,
        crack: 0.45,
        shore: 0,
        cracks: 0,
        bright: 1,
      },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Tight clusters', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -10 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-sheet-that-cannot-rest',
    name: 'Sheet that cannot rest',
    category: 'texture',
    description:
      'Stiff thin ice that keeps cracking while a key is held, as if from a distant station.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Restless ice',
      params: {
        volume: -0.5,
        stretch: 1,
        distance: 0.3,
        ring: 2,
        thick: 0.15,
        cracks: 0.9,
        roam: 0.7,
        shore: 0.1,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Distant station', params: { noise: 0.1, mix: 0.8 } },
      { deviceId: 'currents', preset: 'Restless', params: { rate: 0.4, depth: 0.5 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-frozen-between-bows',
    name: 'Frozen between bows',
    category: 'pad',
    description: 'Long stiff ice with its strokes faded in and dissolved into a slow wash.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { stretch: 1, distance: 0.4, ring: 18, thick: 0.6, crack: 0, cracks: 0, shore: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 800 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-shadow-on-a-third-mode',
    name: 'Shadow on a third mode',
    category: 'drone',
    description:
      'Thin stiff ice with a copy eight half steps up, near the step from its third partial to its fourth, shadowed in slow sines.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: {
        volume: 2,
        stretch: 1,
        distance: 0.1,
        ring: 8,
        thick: 0.1,
        crack: 0,
        shore: 0,
        cracks: 0,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { pitchA: 8, mix: 0.4 } },
      {
        deviceId: 'sine-shadow',
        preset: 'Long linger',
        params: { partials: 14, attack: 700, release: 7, mix: 0.7 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-held-by-what-agrees',
    name: 'Held by what agrees',
    category: 'pad',
    description:
      'Stiff ice in which the partials two notes have in common are frozen and hung on to.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: {
        volume: -1,
        stretch: 1,
        distance: 0.6,
        bright: 0.5,
        ring: 14,
        thick: 0.35,
        cracks: 0,
        shore: 0.2,
      },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Frozen ground', params: { ago: 700, mix: 0.8 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-scale-under-the-floe',
    name: 'Scale under the floe',
    category: 'bell',
    description:
      'Stiff ice struck close and heard from under it, muffled, with bubbles off each stroke.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Ice bells',
      params: {
        volume: -1.5,
        stretch: 1,
        distance: 0.1,
        ring: 5,
        thick: 0.7,
        crack: 0.3,
        bright: 0.8,
        cracks: 0.1,
      },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Under', params: { depth: 0.65, bubbles: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4, breathDepth: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-three-sled-runners',
    name: 'Three sled runners',
    category: 'bell',
    description:
      'Short high zings on the stiff scale, repeated from three tape heads, a little darker each time.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Zing',
      params: {
        volume: -1.5,
        stretch: 1,
        distance: 0.75,
        bright: 1,
        ring: 1.2,
        thick: 0,
        shore: 0.2,
        cracks: 0,
        crack: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dub wash',
        params: { heads: 2, time: 360, feedback: 0.4, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-all-the-upper-modes',
    name: 'All the upper modes',
    category: 'texture',
    description:
      'The thinnest stiff ice with its note swept thin, its upper modes turned up and answered off the shore.',
    preview: ICE_PLATE,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: {
        stretch: 1,
        distance: 0.25,
        ring: 20,
        thick: 0,
        crack: 0.1,
        shore: 0.8,
        cracks: 0.2,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Glass top', params: { amount: 0.8 } },
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { type: 1, cutoffHz: 700, mix: 0.9 },
      },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-halfway-to-stone',
    name: 'Halfway to stone',
    category: 'bell',
    description:
      'Half stiff, thick ice struck right here, short and solid, with a slack spring behind.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Near ping',
      params: {
        volume: -1,
        stretch: 0.5,
        distance: 0,
        ring: 1.6,
        thick: 0.8,
        crack: 0.7,
        shore: 0,
        cracks: 0,
        bright: 0.4,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.35 } },
      { deviceId: 'saturator', preset: 'Warm glue' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-round-the-fishing-hole',
    name: 'Round the fishing hole',
    category: 'drone',
    description:
      'A night lake at half stiffness, deep and long, its cracks and shores turning in a slow figure of eight.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Lake at night',
      params: {
        stretch: 0.5,
        distance: 0.8,
        ring: 16,
        thick: 0.9,
        shore: 0.9,
        cracks: 0.4,
        bright: 0.3,
      },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.12 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-skates-turned-to-breath',
    name: 'Skates turned to breath',
    category: 'pad',
    description:
      'Long zings from far out, smeared by fog until nothing strikes, with their tails lifted.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Zing',
      params: {
        volume: -9,
        stretch: 0.5,
        distance: 0.9,
        ring: 6,
        thick: 0.2,
        shore: 0,
        cracks: 0,
        crack: 0,
        bright: 0.7,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog', params: { size: 500 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.5, limit: 6 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-thaw-taken-in-and-let-go',
    name: 'Thaw taken in and let go',
    category: 'pad',
    description:
      'Half stiff ice that rings half a minute, opened and shut by a slow tide and widened.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: {
        stretch: 0.5,
        distance: 0.5,
        bright: 0.6,
        ring: 30,
        thick: 0.5,
        cracks: 0,
        shore: 0.3,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { depth: 0.85 } },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-echo-up-its-own-partial',
    name: 'Echo up its own partial',
    category: 'bell',
    description:
      'Half stiff ice whose repeats climb 811 cents, the gap between its second and third partials.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Far shores',
      params: {
        volume: 0.5,
        stretch: 0.5,
        distance: 0.35,
        shore: 0,
        ring: 3,
        thick: 0.4,
        crack: 0.4,
        cracks: 0,
      },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { pitch: 8.11, pitchSpray: 0, time: 700, feedback: 0.45, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-ice-on-the-night-band',
    name: 'Ice on the night band',
    category: 'texture',
    description:
      'Restless short cracks on the half stiff scale, narrow and fading on a night radio link.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Restless ice',
      params: {
        volume: -1.5,
        stretch: 0.5,
        distance: 0.7,
        ring: 1,
        thick: 0.6,
        cracks: 1,
        roam: 1,
        shore: 0.6,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { static: 0.25, mix: 1 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-floor-of-the-ice-house',
    name: 'Floor of the ice house',
    category: 'keys',
    description: 'Round close notes of thick ice through a warm loudspeaker, with a small plate.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: {
        volume: -0.5,
        stretch: 0.5,
        distance: 0,
        bright: 0.2,
        ring: 4,
        thick: 1,
        cracks: 0,
        shore: 0,
        crack: 0.05,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.3, distance: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-waves-run-up-the-sheet',
    name: 'Waves run up the sheet',
    category: 'texture',
    description: 'Thin ice broken into bands that swell like waves, in a reverb that pulses.',
    preview: ICE_HALF,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: {
        volume: -1.5,
        stretch: 0.5,
        distance: 0.5,
        ring: 9,
        thick: 0,
        bright: 0.9,
        crack: 0.2,
        cracks: 0.15,
        shore: 0.4,
      },
    },
    effects: [
      { deviceId: 'currents', preset: 'Breaking waves', params: { depth: 0.9, rate: 0.6 } },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-before-the-lake-stiffens',
    name: 'Before the lake stiffens',
    category: 'bell',
    description:
      'Barely stiff ice, long and rounded, its partials a little wide, over a hall that keeps the lows longest.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Ice bells',
      params: {
        stretch: 0.3,
        distance: 0.1,
        ring: 16,
        thick: 0.55,
        crack: 0.05,
        shore: 0.1,
        cracks: 0,
        bright: 0.2,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 6, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-water-still-moving',
    name: 'Water still moving',
    category: 'keys',
    description: 'Short thin pings on barely stiff ice, with a deep phaser and chorused repeats.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: {
        volume: 6,
        stretch: 0.3,
        distance: 0.15,
        ring: 2.2,
        thick: 0.1,
        bright: 0.9,
        width: 0.6,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { mix: 0.6 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-pole-under-the-surface',
    name: 'Pole under the surface',
    category: 'drone',
    description:
      'A deep, barely stiff floe from far off, swelling every two seconds in a very dark reverb.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: {
        stretch: 0.3,
        distance: 0.6,
        bright: 0.1,
        ring: 20,
        thick: 1,
        cracks: 0.1,
        shore: 0.6,
        width: 1,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Sea swell',
        params: { rate: 0.5, depth: 0.8, shape: 0, drift: 0 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-first-skin-on-the-bucket',
    name: 'First skin on the bucket',
    category: 'plucked',
    description:
      'Short round snaps of barely stiff ice that a tape loop lays over one another every two seconds.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: {
        volume: 6,
        stretch: 0.3,
        distance: 0.1,
        ring: 0.8,
        thick: 0.6,
        crack: 0.8,
        bright: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 2, feedback: 0.6, mix: 0.45 },
      },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-slush-with-light-in-it',
    name: 'Slush with light in it',
    category: 'pad',
    description: 'Long falling chirps onto barely stiff ice, gathered into a bright fuzzy halo.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: {
        stretch: 0.3,
        distance: 0.85,
        bright: 0.8,
        ring: 10,
        thick: 0.2,
        cracks: 0,
        shore: 0.1,
      },
    },
    effects: [
      { deviceId: 'haze', preset: 'Glass halo', params: { octave: 0, mix: 0.5 } },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-holes-drilled-in-a-row',
    name: 'Holes drilled in a row',
    category: 'texture',
    description:
      'Close, frequent cracking on barely stiff ice, each pass of a loop leaving more of the room ringing.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Restless ice',
      params: {
        volume: 0.5,
        stretch: 0.3,
        distance: 0.1,
        ring: 3,
        thick: 0.5,
        cracks: 0.7,
        roam: 0.3,
        shore: 0,
        crack: 0.6,
      },
    },
    effects: [
      { deviceId: 'generations', preset: 'Room tone hangs', params: { length: 1.8, mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-old-survey-of-the-lake',
    name: 'Old survey of the lake',
    category: 'bell',
    description:
      'Far strikes on barely stiff ice answered from every shore, kept on the worn end of a record.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Far crack',
      params: {
        stretch: 0.3,
        distance: 0.9,
        bright: 0.5,
        ring: 4,
        thick: 0.75,
        shore: 0.9,
        cracks: 0.2,
        crack: 0.3,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Inner groove', params: { warp: 0.2, surface: 0.3 } },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.3 } },
    ],
  },
  {
    id: 'songs-in-bowl-tuning-four-boats-frozen-in',
    name: 'Four boats frozen in',
    category: 'texture',
    description:
      'Short notes on barely stiff ice, caught in four loops of unequal length behind a slow low-pass.',
    preview: ICE_SLIGHT,
    instrument: {
      deviceId: 'ice',
      preset: 'Frozen lake',
      params: {
        volume: -0.5,
        stretch: 0.3,
        distance: 0.4,
        ring: 1.5,
        thick: 0.3,
        cracks: 0,
        shore: 0.2,
        bright: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Five moons',
        params: { loops: 4, length: 1.1, feedback: 0.8, mix: 0.5 },
      },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 2000 } },
    ],
  },
]
