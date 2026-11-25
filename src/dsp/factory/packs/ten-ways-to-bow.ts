import { type FactoryPreset, type Phrase } from '../types'

// Three open strings in fifths, D A E, and one tune of eight notes, bowed in every manner there is:
// over the fingerboard, flautando, at the bridge, muted, wood struck, wood drawn, harmonics, ragged
// tremolo, a hair's breath, stopped on the string, thrown and pressed, by a few players and by many.

// D3 A3 E4 under one bow, all three strings from the start.
const FIFTHS_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.4, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 5.4, note: 57, gain: 0.55 },
    { atSec: 0, durSec: 5.4, note: 64, gain: 0.55 },
  ],
}

// The same three strings brought in from the lowest up, and let go from the highest down.
const FIFTHS_ENTER: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 50, gain: 0.65 },
    { atSec: 0.9, durSec: 4.7, note: 57, gain: 0.6 },
    { atSec: 1.8, durSec: 3.2, note: 64, gain: 0.6 },
  ],
}

// The chord an octave down, the top string answering twice.
const FIFTHS_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.8, note: 38, gain: 0.65 },
    { atSec: 0, durSec: 5.8, note: 45, gain: 0.5 },
    { atSec: 1, durSec: 1.8, note: 52, gain: 0.55 },
    { atSec: 3.4, durSec: 2.4, note: 52, gain: 0.5 },
  ],
}

// Five down-bows, the bow taken back to the string before each: a chord, and a chord again.
const DOWN_BOWS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 50, gain: 0.85 },
    { atSec: 0, durSec: 0.85, note: 57, gain: 0.75 },
    { atSec: 0, durSec: 0.85, note: 64, gain: 0.75 },
    { atSec: 1.15, durSec: 0.85, note: 50, gain: 0.7 },
    { atSec: 1.15, durSec: 0.85, note: 57, gain: 0.65 },
    { atSec: 1.15, durSec: 0.85, note: 64, gain: 0.65 },
    { atSec: 2.3, durSec: 0.85, note: 50, gain: 0.8 },
    { atSec: 2.3, durSec: 0.85, note: 57, gain: 0.7 },
    { atSec: 2.3, durSec: 0.85, note: 64, gain: 0.7 },
    { atSec: 3.45, durSec: 0.85, note: 50, gain: 0.6 },
    { atSec: 3.45, durSec: 0.85, note: 57, gain: 0.55 },
    { atSec: 3.45, durSec: 0.85, note: 64, gain: 0.55 },
    { atSec: 4.6, durSec: 1.4, note: 50, gain: 0.5 },
    { atSec: 4.6, durSec: 1.4, note: 57, gain: 0.45 },
    { atSec: 4.6, durSec: 1.4, note: 64, gain: 0.45 },
  ],
}

// The thrown bow: on each string one throw, six bounces that come closer and softer.
const THROWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.16, note: 50, gain: 0.9 },
    { atSec: 0.36, durSec: 0.14, note: 50, gain: 0.75 },
    { atSec: 0.65, durSec: 0.12, note: 50, gain: 0.62 },
    { atSec: 0.88, durSec: 0.1, note: 50, gain: 0.5 },
    { atSec: 1.06, durSec: 0.09, note: 50, gain: 0.4 },
    { atSec: 1.2, durSec: 0.08, note: 50, gain: 0.3 },
    { atSec: 1.8, durSec: 0.16, note: 57, gain: 0.85 },
    { atSec: 2.14, durSec: 0.14, note: 57, gain: 0.7 },
    { atSec: 2.41, durSec: 0.12, note: 57, gain: 0.58 },
    { atSec: 2.63, durSec: 0.1, note: 57, gain: 0.46 },
    { atSec: 2.8, durSec: 0.09, note: 57, gain: 0.36 },
    { atSec: 2.93, durSec: 0.08, note: 57, gain: 0.28 },
    { atSec: 3.6, durSec: 0.16, note: 64, gain: 0.85 },
    { atSec: 3.92, durSec: 0.14, note: 64, gain: 0.7 },
    { atSec: 4.17, durSec: 0.12, note: 64, gain: 0.58 },
    { atSec: 4.37, durSec: 0.1, note: 64, gain: 0.46 },
    { atSec: 4.53, durSec: 0.09, note: 64, gain: 0.36 },
    { atSec: 4.65, durSec: 0.08, note: 64, gain: 0.28 },
  ],
}

// The bow stopped on the string: the chord bitten off short, and the silence kept.
const STOPPED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.2, note: 50, gain: 0.9 },
    { atSec: 0, durSec: 0.2, note: 57, gain: 0.8 },
    { atSec: 0, durSec: 0.2, note: 64, gain: 0.8 },
    { atSec: 1.2, durSec: 0.2, note: 57, gain: 0.7 },
    { atSec: 1.6, durSec: 0.2, note: 64, gain: 0.75 },
    { atSec: 2.4, durSec: 0.2, note: 50, gain: 0.85 },
    { atSec: 2.4, durSec: 0.2, note: 57, gain: 0.75 },
    { atSec: 2.4, durSec: 0.2, note: 64, gain: 0.75 },
    { atSec: 3.6, durSec: 0.2, note: 64, gain: 0.7 },
    { atSec: 4, durSec: 0.2, note: 57, gain: 0.6 },
    { atSec: 4.8, durSec: 0.2, note: 50, gain: 0.8 },
    { atSec: 4.8, durSec: 0.2, note: 57, gain: 0.7 },
    { atSec: 4.8, durSec: 0.2, note: 64, gain: 0.7 },
  ],
}

// The bow rocked over the three strings and back, D A E A, seven times and home.
const ROCKED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.24, note: 50, gain: 0.7 },
    { atSec: 0.2, durSec: 0.24, note: 57, gain: 0.55 },
    { atSec: 0.4, durSec: 0.24, note: 64, gain: 0.6 },
    { atSec: 0.6, durSec: 0.24, note: 57, gain: 0.5 },
    { atSec: 0.8, durSec: 0.24, note: 50, gain: 0.7 },
    { atSec: 1, durSec: 0.24, note: 57, gain: 0.55 },
    { atSec: 1.2, durSec: 0.24, note: 64, gain: 0.6 },
    { atSec: 1.4, durSec: 0.24, note: 57, gain: 0.5 },
    { atSec: 1.6, durSec: 0.24, note: 50, gain: 0.7 },
    { atSec: 1.8, durSec: 0.24, note: 57, gain: 0.55 },
    { atSec: 2, durSec: 0.24, note: 64, gain: 0.6 },
    { atSec: 2.2, durSec: 0.24, note: 57, gain: 0.5 },
    { atSec: 2.4, durSec: 0.24, note: 50, gain: 0.7 },
    { atSec: 2.6, durSec: 0.24, note: 57, gain: 0.55 },
    { atSec: 2.8, durSec: 0.24, note: 64, gain: 0.6 },
    { atSec: 3, durSec: 0.24, note: 57, gain: 0.5 },
    { atSec: 3.2, durSec: 0.24, note: 50, gain: 0.7 },
    { atSec: 3.4, durSec: 0.24, note: 57, gain: 0.55 },
    { atSec: 3.6, durSec: 0.24, note: 64, gain: 0.6 },
    { atSec: 3.8, durSec: 0.24, note: 57, gain: 0.5 },
    { atSec: 4, durSec: 0.24, note: 50, gain: 0.7 },
    { atSec: 4.2, durSec: 0.24, note: 57, gain: 0.55 },
    { atSec: 4.4, durSec: 0.24, note: 64, gain: 0.6 },
    { atSec: 4.6, durSec: 0.24, note: 57, gain: 0.5 },
    { atSec: 4.8, durSec: 0.24, note: 50, gain: 0.7 },
    { atSec: 5, durSec: 0.24, note: 57, gain: 0.55 },
    { atSec: 5.2, durSec: 0.24, note: 64, gain: 0.6 },
    { atSec: 5.4, durSec: 0.24, note: 57, gain: 0.5 },
    { atSec: 5.6, durSec: 0.6, note: 50, gain: 0.6 },
  ],
}

// Three strings touched at the half, the third and the quarter, so the octave, the twelfth and the
// double octave of D A E sound; the open D and A are left under them, faint.
const TOUCHED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6, note: 50, gain: 0.2 },
    { atSec: 0, durSec: 6, note: 57, gain: 0.2 },
    { atSec: 0, durSec: 1.9, note: 62, gain: 0.6 },
    { atSec: 0.2, durSec: 1.7, note: 69, gain: 0.55 },
    { atSec: 0.4, durSec: 1.5, note: 76, gain: 0.5 },
    { atSec: 2, durSec: 1.9, note: 69, gain: 0.6 },
    { atSec: 2.2, durSec: 1.7, note: 76, gain: 0.5 },
    { atSec: 2.4, durSec: 1.5, note: 83, gain: 0.4 },
    { atSec: 4, durSec: 2, note: 74, gain: 0.55 },
    { atSec: 4.2, durSec: 1.8, note: 81, gain: 0.45 },
    { atSec: 4.4, durSec: 1.6, note: 88, gain: 0.35 },
  ],
}

// The tune of eight notes on D, white keys only: up a fifth, down a step and a third, up a step, down a
// fourth, up a third and home by step from E.
const EIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.64, note: 62, gain: 0.6 },
    { atSec: 0.7, durSec: 0.64, note: 69, gain: 0.75 },
    { atSec: 1.4, durSec: 0.64, note: 67, gain: 0.65 },
    { atSec: 2.1, durSec: 0.64, note: 64, gain: 0.6 },
    { atSec: 2.8, durSec: 0.64, note: 65, gain: 0.7 },
    { atSec: 3.5, durSec: 0.64, note: 60, gain: 0.55 },
    { atSec: 4.2, durSec: 0.64, note: 64, gain: 0.6 },
    { atSec: 4.9, durSec: 1.3, note: 62, gain: 0.55 },
  ],
}

// The same eight notes under one slur, a little slower, each let go just after the next has begun.
const EIGHT_SLURRED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.84, note: 62, gain: 0.6 },
    { atSec: 0.76, durSec: 0.84, note: 69, gain: 0.7 },
    { atSec: 1.52, durSec: 0.84, note: 67, gain: 0.65 },
    { atSec: 2.28, durSec: 0.84, note: 64, gain: 0.6 },
    { atSec: 3.04, durSec: 0.84, note: 65, gain: 0.7 },
    { atSec: 3.8, durSec: 0.84, note: 60, gain: 0.6 },
    { atSec: 4.56, durSec: 0.84, note: 64, gain: 0.6 },
    { atSec: 5.32, durSec: 1.3, note: 62, gain: 0.6 },
  ],
}

// The same eight notes off the string, each cut short where it starts.
const EIGHT_OFF: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.14, note: 62, gain: 0.8 },
    { atSec: 0.7, durSec: 0.14, note: 69, gain: 0.9 },
    { atSec: 1.4, durSec: 0.14, note: 67, gain: 0.75 },
    { atSec: 2.1, durSec: 0.14, note: 64, gain: 0.7 },
    { atSec: 2.8, durSec: 0.14, note: 65, gain: 0.85 },
    { atSec: 3.5, durSec: 0.14, note: 60, gain: 0.65 },
    { atSec: 4.2, durSec: 0.14, note: 64, gain: 0.7 },
    { atSec: 4.9, durSec: 0.14, note: 62, gain: 0.8 },
  ],
}

// The same eight notes an octave down, for the cellos.
const EIGHT_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.68, note: 50, gain: 0.65 },
    { atSec: 0.7, durSec: 0.68, note: 57, gain: 0.75 },
    { atSec: 1.4, durSec: 0.68, note: 55, gain: 0.65 },
    { atSec: 2.1, durSec: 0.68, note: 52, gain: 0.6 },
    { atSec: 2.8, durSec: 0.68, note: 53, gain: 0.7 },
    { atSec: 3.5, durSec: 0.68, note: 48, gain: 0.6 },
    { atSec: 4.2, durSec: 0.68, note: 52, gain: 0.6 },
    { atSec: 4.9, durSec: 1.4, note: 50, gain: 0.6 },
  ],
}

// The same eight notes an octave up, over an open D and A held softly.
const EIGHT_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 50, gain: 0.3 },
    { atSec: 0, durSec: 6.2, note: 57, gain: 0.25 },
    { atSec: 0, durSec: 0.7, note: 74, gain: 0.5 },
    { atSec: 0.7, durSec: 0.7, note: 81, gain: 0.6 },
    { atSec: 1.4, durSec: 0.7, note: 79, gain: 0.55 },
    { atSec: 2.1, durSec: 0.7, note: 76, gain: 0.5 },
    { atSec: 2.8, durSec: 0.7, note: 77, gain: 0.55 },
    { atSec: 3.5, durSec: 0.7, note: 72, gain: 0.45 },
    { atSec: 4.2, durSec: 0.7, note: 76, gain: 0.5 },
    { atSec: 4.9, durSec: 1.3, note: 74, gain: 0.5 },
  ],
}

// The same eight notes an octave up, alone.
const EIGHT_ALOFT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.66, note: 74, gain: 0.55 },
    { atSec: 0.7, durSec: 0.66, note: 81, gain: 0.7 },
    { atSec: 1.4, durSec: 0.66, note: 79, gain: 0.6 },
    { atSec: 2.1, durSec: 0.66, note: 76, gain: 0.55 },
    { atSec: 2.8, durSec: 0.66, note: 77, gain: 0.65 },
    { atSec: 3.5, durSec: 0.66, note: 72, gain: 0.5 },
    { atSec: 4.2, durSec: 0.66, note: 76, gain: 0.55 },
    { atSec: 4.9, durSec: 1.3, note: 74, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // chamber-strings
  {
    id: 'ten-ways-to-bow-bows-up-by-the-fingers',
    name: 'Bows up by the fingers',
    category: 'string',
    description:
      'Six muted players bow right over the fingerboard, drifting apart as they enter, a body of warm wood and a slow hall of lows round them.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: {
        players: 6,
        attack: 2.2,
        release: 2.6,
        bow: 0.03,
        air: 0.35,
        vibrato: 0,
        mute: 0.7,
        scatter: 0.8,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.5, mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-flautando-inside-desk',
    name: 'Flautando, inside desk',
    category: 'string',
    description:
      'Two bows drawn fast and light in unmuted flute tone, a late narrow vibrato growing on each note, a faint bright plate behind.',
    preview: EIGHT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: {
        volume: -1.5,
        players: 2,
        attack: 0.22,
        release: 0.7,
        bow: 0,
        air: 0.75,
        vibrato: 0,
        mute: 0,
        scatter: 0.15,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 180, grow: 350, depth: 16 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-four-bows-on-the-bridge',
    name: 'Four bows on the bridge',
    category: 'string',
    description:
      'Four bows hard on the bridge, shaken fourteen times a second between left and right, lows cut, with a short bright chamber after them.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: {
        volume: -3,
        players: 4,
        attack: 0.3,
        release: 1.2,
        bow: 0.97,
        air: 0.5,
        vibrato: 0,
        mute: 0,
        scatter: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Fast shudder',
        params: { rate: 14, depth: 0.55, phase: 120, drift: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 9000 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-sordino-in-the-cupboard',
    name: 'Sordino in the cupboard',
    category: 'string',
    description:
      'One muted player with a wide vibrato, played again through a loudspeaker shut in a cupboard with the microphone well back.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: {
        volume: -2,
        players: 1,
        attack: 0.4,
        release: 0.9,
        bow: 0.3,
        air: 0.1,
        vibrato: 30,
        mute: 1,
        scatter: 0.4,
        width: 0,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { treble: -0.4 } }],
  },
  {
    id: 'ten-ways-to-bow-four-bows-stopped-dead',
    name: 'Four bows stopped dead',
    category: 'string',
    description:
      'Four unmuted bows started hard and stopped on the string, squeezed by a fast limiter, each chord answered by a gated burst of room.',
    preview: STOPPED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: {
        players: 4,
        attack: 0.05,
        release: 0.1,
        bow: 0.6,
        air: 0.35,
        vibrato: 0,
        mute: 0,
        scatter: 0.05,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.28, mix: 0.35 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-tratto-hair-turned-away',
    name: 'Tratto, hair turned away',
    category: 'texture',
    description:
      'Three muted bows near the bridge at full bow noise, the tone itself filtered off below fifteen hundred hertz until the drawn wood is left.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: {
        volume: -2,
        players: 3,
        attack: 0.7,
        release: 1.2,
        bow: 0.95,
        air: 1,
        vibrato: 0,
        mute: 0.8,
        scatter: 0.6,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 1500 } },
      { deviceId: 'reveal', preset: 'Air', params: { output: 2 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'ten-ways-to-bow-finger-laid-not-pressed',
    name: 'Finger laid, not pressed',
    category: 'string',
    description:
      'Three quick players without vibrato touch harmonics, and each partial grows a pure sine an octave up that stays after the bow.',
    preview: TOUCHED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: {
        players: 3,
        attack: 0.12,
        release: 1.4,
        bow: 0.7,
        air: 0.5,
        vibrato: 0,
        mute: 0.3,
        scatter: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { attack: 250, release: 3, mix: 0.5 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-six-wrists-no-two-alike',
    name: 'Six wrists, no two alike',
    category: 'string',
    description:
      'Six scattered players in ragged tremolo, the level jumping at random eleven times a second, in a thick flock of delays.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: {
        volume: -2,
        players: 6,
        attack: 0.35,
        release: 1.6,
        bow: 0.45,
        air: 0.5,
        vibrato: 2,
        mute: 0.1,
        scatter: 1,
        width: 1,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 11, depth: 0.85, shape: 3, phase: 70, drift: 0.8, smooth: 0.15 },
      },
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-one-hair-on-the-a-string',
    name: 'One hair on the A string',
    category: 'string',
    description:
      "A lone wandering bow with more breath than note, its quiet end lifted up and a close microphone's own air left open round it.",
    preview: EIGHT_ALOFT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: {
        players: 1,
        attack: 0.5,
        release: 1.5,
        bow: 0.12,
        air: 1,
        vibrato: 0,
        mute: 0,
        scatter: 0.5,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'lift', preset: 'Air on top' },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -46 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-weight-on-the-frog',
    name: 'Weight on the frog',
    category: 'string',
    description:
      'Four players press a bright bow into the string: thirty small catches a second in the middle of the tone, and a valve stage breaking up.',
    preview: DOWN_BOWS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: {
        players: 4,
        attack: 0.08,
        release: 0.5,
        bow: 0.85,
        air: 0.8,
        vibrato: 5,
        mute: 0,
        scatter: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        preset: 'Forty ticks',
        params: { rate: 30, depth: 0.8, duty: 0.35, low: 150, high: 2600 },
      },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6 } },
    ],
  },
  // tape-orchestra
  {
    id: 'ten-ways-to-bow-reel-of-the-fingerboard',
    name: 'Reel of the fingerboard',
    category: 'string',
    description:
      'A full strip of taped strings with the top turned far down and no vibrato, fading in slowly off nearly clean tape, in a dark hall.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        age: 0.1,
        hiss: 0.1,
        tone: -0.8,
        attack: 1.4,
        release: 2.2,
        players: 0.95,
        vibrato: 0,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.45 } }],
  },
  {
    id: 'ten-ways-to-bow-two-celli-over-the-board',
    name: 'Two celli over the board',
    category: 'string',
    description:
      'The fewest taped cellos close by, vibrato off and everything above a thousand hertz cut away, so only the round of the bow is left.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        volume: 2.5,
        age: 0.2,
        hiss: 0.05,
        tone: -0.5,
        attack: 0.18,
        release: 0.5,
        players: 0.05,
        vibrato: 0,
        spread: 0.1,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1000, low: 1 } },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  {
    id: 'ten-ways-to-bow-flute-tone-flute-reel',
    name: 'Flute tone, flute reel',
    category: 'wind',
    description:
      'The flute tape stands in for a bow drawn fast and light: still, soft at the start, blurred for a moment and doubled a little off pitch.',
    preview: EIGHT_ALOFT,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: {
        volume: -5,
        age: 0.15,
        hiss: 0.1,
        tone: 0,
        attack: 0.16,
        release: 0.8,
        players: 0.5,
        vibrato: 0,
        spread: 0.8,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil', params: { size: 120, soften: 0.4, mix: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-flautando-whole-floor',
    name: 'Flautando, whole floor',
    category: 'string',
    description:
      'A whole section of taped strings with its attack sifted out and its air pushed forward and wide, the tone held a little after each note.',
    preview: EIGHT_SLURRED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        volume: -2,
        age: 0.3,
        hiss: 0.4,
        tone: -0.2,
        attack: 0.35,
        release: 1,
        players: 1,
        vibrato: 0.1,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Breath and tone' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'ten-ways-to-bow-horsehair-against-bridge',
    name: 'Horsehair against bridge',
    category: 'string',
    description:
      'Taped strings with all the bass filtered off below nine hundred hertz and the treble full up, shaking twelve times a second.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        volume: -5,
        age: 0.2,
        hiss: 0.3,
        tone: 1,
        attack: 0.2,
        release: 0.9,
        players: 0.8,
        vibrato: 0,
        spread: 0.6,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 900, slope: 0 } },
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 12, depth: 0.5, shape: 1, drift: 0.5, smooth: 0 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-cello-bow-on-the-bridge',
    name: 'Cello bow on the bridge',
    category: 'string',
    description:
      'Very few taped cellos with the treble up and a folding drive mixed in under them, thin and glassy with the fundamental cut back.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        volume: -3.5,
        age: 0.1,
        hiss: 0.1,
        tone: 1,
        attack: 0.06,
        release: 0.35,
        players: 0,
        vibrato: 0.2,
        spread: 0,
      },
    },
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Thin',
        params: { lowCut: 400, presence: 6, highCut: 9000 },
      },
      { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-rubber-mute-on-the-reel',
    name: 'Rubber mute on the reel',
    category: 'string',
    description:
      'A handful of taped violins with their wooden bodies made smaller and their tops shut, played in a tight little room.',
    preview: EIGHT,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        volume: -3.5,
        age: 0.4,
        hiss: 0.2,
        tone: -0.6,
        attack: 0.08,
        release: 0.4,
        players: 0.4,
        vibrato: 0.5,
        spread: 0.25,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { size: -0.6 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'ten-ways-to-bow-half-speed-mutes',
    name: 'Half-speed mutes',
    category: 'pad',
    description:
      'The string tape at half speed, muffled and wavering as if a little under water, with ten dull copies of itself far out to the sides.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Sunken strings',
      params: {
        age: 0.3,
        hiss: 0.05,
        tone: -0.5,
        attack: 0.5,
        release: 1.2,
        players: 0.6,
        vibrato: 0.4,
        spread: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Just under',
        params: { bubbles: 0, depth: 0.4, waver: 0.8, rate: 0.9 },
      },
      { deviceId: 'murmuration', preset: 'Wide and dull' },
    ],
  },
  {
    id: 'ten-ways-to-bow-sticks-on-every-string',
    name: 'Sticks on every string',
    category: 'plucked',
    description:
      'Taped violins stopped as soon as they start, with little but the strike sifted out of them, rattling once in a spring.',
    preview: EIGHT_OFF,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Strings run out',
      params: {
        volume: 6,
        age: 0.3,
        hiss: 0.1,
        tone: 0.3,
        length: 2,
        attack: 0.005,
        release: 0.05,
        players: 0.3,
        vibrato: 0,
        spread: 0.3,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { tones: -16, attacks: 6 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-battuto-from-the-cellos',
    name: 'Battuto from the cellos',
    category: 'plucked',
    description:
      'Short taped cellos with the knock sifted up over the note, scattered into a close flicker of nine echoes, a desk not quite together.',
    preview: STOPPED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        volume: 5,
        age: 0.2,
        hiss: 0,
        tone: 0.4,
        length: 2,
        attack: 0.005,
        release: 0.07,
        players: 0.6,
        vibrato: 0,
        spread: 0.6,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { tones: -14, attacks: 6 } },
      {
        deviceId: 'constellation',
        preset: 'Close flicker',
        params: { span: 240, stars: 9, again: 0.1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-dry-wood-over-the-reel',
    name: 'Dry wood over the reel',
    category: 'texture',
    description:
      'Very old taped strings with the hiss full up and a narrow band left open round two thousand hertz, its quiet parts brought forward.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        volume: -2,
        age: 0.8,
        hiss: 1,
        tone: 0.6,
        length: 9,
        attack: 0.3,
        release: 0.8,
        players: 0.3,
        vibrato: 0,
        spread: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Phone line',
        params: { cutoffHz: 2000, driveDb: 0, resonance: 0.9 },
      },
      { deviceId: 'reveal', preset: 'Breath' },
    ],
  },
  {
    id: 'ten-ways-to-bow-sticks-all-turned-over',
    name: 'Sticks all turned over',
    category: 'texture',
    description:
      'Half-speed taped strings with strong hiss, everything low taken off and the rest sent into a bright hall that breathes it in by waves.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Sunken strings',
      params: {
        age: 0.6,
        hiss: 0.9,
        tone: 1,
        attack: 0.9,
        release: 2,
        players: 1,
        vibrato: 0,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { lowCut: 500 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { breathDepth: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-nodes-off-a-cello-tape',
    name: 'Nodes off a cello tape',
    category: 'bell',
    description:
      'Still taped cellos heard almost only through added pipes a twelfth and two octaves up, as the fingers barely touch the strings.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        volume: -3.5,
        age: 0.05,
        hiss: 0.05,
        tone: -0.3,
        attack: 0.5,
        release: 1.5,
        players: 0.2,
        vibrato: 0,
        spread: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Glass on top',
        params: { unison: 0.12, twelfth: 0.9, fifteenth: 0.8, tone: 0.35, mix: 0.9 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-a-section-of-open-nodes',
    name: 'A section of open nodes',
    category: 'string',
    description:
      'A full still string section on clean tape with mostly its octave and double octave let through, spread wide in a long bright tail.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        age: 0,
        hiss: 0,
        tone: 0.3,
        attack: 0.2,
        release: 1.2,
        players: 0.9,
        vibrato: 0,
        spread: 1,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'High voice alone',
        params: { up1: 0.8, up2: 0.3, dry: 0.15, attack: 0.1, spread: 0.9 },
      },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-shaking-reel-one-stand',
    name: 'Shaking reel, one stand',
    category: 'string',
    description:
      'Two or three taped violins in ragged tremolo, jumping at random nine times a second over a wobble of worn tape.',
    preview: EIGHT_SLURRED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        volume: -1,
        age: 0.9,
        hiss: 0.4,
        tone: 0.2,
        length: 8,
        attack: 0.02,
        release: 0.3,
        players: 0.2,
        vibrato: 0.2,
        spread: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 9, depth: 0.9, shape: 3, phase: 0, drift: 0.6, smooth: 0.1 },
      },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
    ],
  },
  {
    id: 'ten-ways-to-bow-low-tremolo-every-cello',
    name: 'Low tremolo, every cello',
    category: 'string',
    description:
      'All the taped cellos trembling on uneven patterns that pull apart from one another, darker whenever a gate shuts.',
    preview: FIFTHS_LOW,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        volume: -5,
        age: 0.3,
        hiss: 0.1,
        tone: 0.1,
        attack: 0.25,
        release: 1.4,
        players: 1,
        vibrato: 0.6,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Wide weave', params: { rate: 11, floor: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'ten-ways-to-bow-hardly-any-hair-on-tape',
    name: 'Hardly any hair on tape',
    category: 'string',
    description:
      'A few old taped violins rolled dark and drawn in slow breaths, with the air of each breath let through and the soft end turned up.',
    preview: EIGHT_SLURRED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        age: 0.6,
        hiss: 0.7,
        tone: -0.7,
        attack: 0.3,
        release: 0.9,
        players: 0.15,
        vibrato: 0,
        spread: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Asleep',
        params: { in: 1.6, out: 2, rest: 0.6, depth: 0.6, air: 0.9 },
      },
      { deviceId: 'lift', preset: 'Quiet end up' },
    ],
  },
  {
    id: 'ten-ways-to-bow-whole-reel-in-a-whisper',
    name: 'Whole reel in a whisper',
    category: 'pad',
    description:
      'A full taped section set at the far side of a hall, darkened and narrowed by the distance and wandering a little nearer and farther.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        age: 0.35,
        hiss: 0.6,
        tone: 0.1,
        attack: 2,
        release: 3.5,
        players: 0.8,
        vibrato: 0.15,
        spread: 0.8,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore', params: { wander: 0.35, rate: 0.15 } }],
  },
  {
    id: 'ten-ways-to-bow-thumb-on-the-reel',
    name: 'Thumb on the reel',
    category: 'string',
    description:
      'Taped violins bitten off short, hit hard into a fast limiter and recorded again through a small loudspeaker.',
    preview: STOPPED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        age: 0.4,
        hiss: 0.2,
        tone: 0.5,
        length: 2,
        attack: 0.005,
        release: 0.06,
        players: 0.5,
        vibrato: 0.1,
        spread: 0.2,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { drive: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-retaken-at-the-heel',
    name: 'Retaken at the heel',
    category: 'string',
    description:
      'The cello tape in hard retaken down-bows with a warm transformer under it, each chord followed by a straight falling burst of room.',
    preview: DOWN_BOWS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        age: 0.25,
        hiss: 0.15,
        tone: -0.1,
        attack: 0.01,
        release: 0.3,
        players: 0.8,
        vibrato: 0.5,
        spread: 0.7,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 0.9 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-thrown-from-a-tape-key',
    name: 'Thrown from a tape key',
    category: 'plucked',
    description:
      'Short taped violins whose every note is thrown: echoes follow closer and closer, crossing from side to side, like a bow let bounce.',
    preview: EIGHT_OFF,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        volume: 4,
        age: 0.35,
        hiss: 0.1,
        tone: 0.2,
        length: 2,
        attack: 0.005,
        release: 0.09,
        players: 0.5,
        vibrato: 0,
        spread: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Ball on glass',
        params: { first: 150, bounce: 0.8, skips: 7, loss: 2, throw: 0.7, mix: 0.5 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-pressed-until-it-grinds',
    name: 'Pressed until it grinds',
    category: 'string',
    description:
      'A few taped cellos leant on through a dark fuzz, with a ring at twenty-seven hertz turned in under the drive.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        volume: -13,
        age: 0.5,
        hiss: 0.1,
        tone: 0.6,
        attack: 0.04,
        release: 0.4,
        players: 0.3,
        vibrato: 0.2,
        spread: 0.2,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Low growl', params: { mix: 0.35 } },
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
    ],
  },
  {
    id: 'ten-ways-to-bow-a-floor-of-heavy-bows',
    name: 'A floor of heavy bows',
    category: 'pad',
    description:
      'The whole taped section pressed into a fuzzed wall: a short blur, a soft overdrive and a long reverb as one sustained sheet.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        age: 0.5,
        hiss: 0.2,
        tone: 0.2,
        attack: 0.3,
        release: 1.4,
        players: 1,
        vibrato: 0.3,
        spread: 0.9,
      },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { tone: 0.45, mix: 0.5 } }],
  },
  {
    id: 'ten-ways-to-bow-fingers-to-the-bridge',
    name: 'Fingers to the bridge',
    category: 'string',
    description:
      'Taped strings whose bow travels: one slow filter opens from dull fingerboard to bright bridge and back again every five seconds.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        age: 0.15,
        hiss: 0.2,
        tone: 0.8,
        attack: 0.4,
        release: 1.3,
        players: 0.7,
        vibrato: 0.2,
        spread: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 1100, lfoAmount: 90, lfoRateHz: 0.2, resonance: 1.8, driveDb: 0 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'ten-ways-to-bow-bows-in-slow-circles',
    name: 'Bows in slow circles',
    category: 'pad',
    description:
      'A few taped cellos carried round the head in a circle every four seconds, near and then far, their vibrato let in late and wide.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        age: 0.6,
        hiss: 0.05,
        tone: 0.6,
        attack: 0.25,
        release: 0.9,
        players: 0.4,
        vibrato: 0,
        spread: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Wide drone',
        params: { depth: 30, wait: 300, grow: 1200 },
      },
      { deviceId: 'around', preset: 'Passing by', params: { rate: 0.25, near: 0.5 } },
    ],
  },
  // graft
  {
    id: 'ten-ways-to-bow-bowed-at-the-halfway',
    name: 'Bowed at the halfway',
    category: 'string',
    description:
      'A modelled string bowed lightly at its middle and left ringing, inside a small wooden soundboard, one soft tape echo close behind.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -5,
        pressure: 0.4,
        position: 0.5,
        bright: 0.38,
        air: 0.25,
        decay: 6,
        swell: 0.1,
        release: 2.2,
        wander: 0.15,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.5, mix: 0.75 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
    ],
  },
  {
    id: 'ten-ways-to-bow-sixteen-over-the-board',
    name: 'Sixteen over the board',
    category: 'pad',
    description:
      'A soft middle-bowed string turned into sixteen that fly about at different delays, all entering slowly and ringing down slowly.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -5,
        pressure: 0.3,
        position: 0.42,
        bright: 0.22,
        air: 0.35,
        decay: 8,
        swell: 1.8,
        release: 3.5,
        wander: 0.6,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { range: 20, mix: 0.75 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-fast-bow-no-weight',
    name: 'Fast bow, no weight',
    category: 'wind',
    description:
      'A string bowed near its middle with so little weight that hardly more than its fundamental is left, its breath brought forward.',
    preview: EIGHT,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: 0.5,
        pressure: 0.12,
        position: 0.45,
        bright: 0.35,
        air: 0.75,
        swell: 0.16,
        release: 0.4,
        wander: 0.1,
        width: 0.4,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Breath and tone', params: { hold: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'ten-ways-to-bow-a-finger-off-the-bridge',
    name: 'A finger off the bridge',
    category: 'string',
    description:
      'A bright string bowed right at its end, its low partials held down and its upper ones lifted one by one until they whistle.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -2.5,
        pressure: 0.45,
        position: 0.03,
        bright: 0.95,
        air: 0.3,
        swell: 0.06,
        release: 0.35,
        wander: 0.2,
        width: 0.1,
      },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 350, highCut: 9000 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-bridge-all-shaking',
    name: 'Bridge, all shaking',
    category: 'string',
    description:
      'A bright string bowed at its very end, lows thinned, its band above four hundred hertz fluttering side to side, in a wide chorus.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -2.5,
        pressure: 0.65,
        position: 0.03,
        bright: 1,
        air: 0.5,
        swell: 0.3,
        release: 1,
        wander: 0.7,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 600, slope: 0 } },
      {
        deviceId: 'band-pulse',
        preset: 'Side flutter',
        params: { rate: 15, low: 400, high: 4000 },
      },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'ten-ways-to-bow-ebony-comb-on-four-feet',
    name: 'Ebony comb on four feet',
    category: 'string',
    description:
      'A firmly bowed string with its top shut in and its body shrunk, the nasal middle that a mute leaves, close in a narrow old tank.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -3.5,
        pressure: 0.6,
        position: 0.2,
        bright: 0.05,
        air: 0.1,
        swell: 0.1,
        release: 0.5,
        wander: 0.3,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { size: -0.5, tone: -0.2 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'ten-ways-to-bow-wood-of-the-bow-struck',
    name: 'Wood of the bow, struck',
    category: 'plucked',
    description:
      'A mallet on a string, a fifth of the way along, with much air in the knock, heard from the far side of a room and levelled hard.',
    preview: EIGHT_OFF,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: {
        volume: -12.5,
        position: 0.2,
        bright: 0.3,
        decay: 1,
        air: 0.8,
        release: 0.6,
        wander: 0.1,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 24, outputGain: -6.8 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-a-rain-of-bow-sticks',
    name: 'A rain of bow sticks',
    category: 'plucked',
    description:
      'A struck string that rings a second, scattered into twelve quick echoes of its own so one stick becomes a desk of them.',
    preview: THROWN,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: {
        volume: 2,
        position: 0.12,
        bright: 0.55,
        decay: 1.2,
        air: 0.6,
        release: 0.6,
        wander: 0.3,
        width: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Shimmer field',
        params: { span: 420, again: 0.15, drift: 0.5, mix: 0.55 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-wood-drawn-none-struck',
    name: 'Wood drawn, none struck',
    category: 'texture',
    description:
      'A bow of no pressure and all air, the note filtered off under a thousand hertz, what is left turned up and moving in bands.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: 6,
        pressure: 0,
        position: 0.3,
        bright: 0.5,
        air: 1,
        swell: 0.5,
        release: 0.8,
        wander: 0.5,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 1000 } },
      { deviceId: 'reveal', preset: 'Breath', params: { output: 12 } },
      { deviceId: 'currents', preset: 'Ripples', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-sticks-drawn-on-the-rib',
    name: 'Sticks drawn on the rib',
    category: 'texture',
    description:
      'A bow drawn with much air on a stopped pipe in place of a string: the hollow side of the instrument, slow, blurred and dark.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        volume: -3.5,
        pressure: 0.15,
        position: 0.6,
        bright: 0.45,
        air: 0.9,
        swell: 0.8,
        release: 1.5,
        wander: 0.5,
        width: 0.8,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.7 } }],
  },
  {
    id: 'ten-ways-to-bow-node-at-the-third',
    name: 'Node at the third',
    category: 'string',
    description:
      'A string bowed lightly at a third of its length on high nodes, with a bank of strings that learns its notes and rings on.',
    preview: TOUCHED,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -14.5,
        pressure: 0.3,
        position: 0.33,
        bright: 0.6,
        air: 0.4,
        decay: 6,
        swell: 0.1,
        release: 1.8,
        wander: 0.1,
        width: 0.4,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { root: 2, mix: 0.5 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-open-node-on-a-glass-bar',
    name: 'Open node on a glass bar',
    category: 'bell',
    description:
      'A bow drawn hard on a bright bar, more than half of it redrawn as sines an octave up, with a harmonic tremolo rocking highs against lows.',
    preview: TOUCHED,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: {
        pressure: 0.6,
        position: 0.5,
        bright: 0.95,
        air: 0.3,
        decay: 3,
        swell: 0.12,
        release: 1.4,
        wander: 0.5,
        width: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { partials: 10, attack: 120, mix: 0.65 },
      },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
    ],
  },
  {
    id: 'ten-ways-to-bow-elbow-loose-wrist-quick',
    name: 'Elbow loose, wrist quick',
    category: 'string',
    description:
      'A lone bowed string that wanders in pitch and stutters at random thirteen times a second, its repeats slapped back once off the wall.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -2.5,
        pressure: 0.6,
        position: 0.15,
        bright: 0.6,
        air: 0.35,
        swell: 0.03,
        release: 0.2,
        wander: 1,
        width: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 13, depth: 1, shape: 3, phase: 0, drift: 0.7, smooth: 0.1 },
      },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'ten-ways-to-bow-breath-instead-of-a-bow',
    name: 'Breath instead of a bow',
    category: 'wind',
    description:
      'Breath set on the string where the bow would be, hardly any of it, slow to start, its quiet end turned up until the air is heard.',
    preview: EIGHT_HIGH,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: {
        pressure: 0.18,
        position: 0.3,
        bright: 0.4,
        air: 0.95,
        swell: 0.3,
        release: 0.9,
        wander: 0.4,
        width: 0.5,
      },
    },
    effects: [{ deviceId: 'lift', preset: 'Air on top', params: { threshold: -18 } }],
  },
  {
    id: 'ten-ways-to-bow-bow-nailed-to-the-string',
    name: 'Bow nailed to the string',
    category: 'string',
    description:
      'A hard-pressed string that starts at once and is choked at once, its body pushed by a valve and heard through a speaker shut in a cupboard.',
    preview: STOPPED,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        pressure: 0.85,
        position: 0.22,
        bright: 0.65,
        air: 0.2,
        swell: 0.005,
        release: 0.03,
        wander: 0.1,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9, outputDb: -5 } },
      { deviceId: 're-amp', preset: 'In the cupboard', params: { distance: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-eight-bounces-and-gone',
    name: 'Eight bounces and gone',
    category: 'plucked',
    description:
      'A short struck string thrown again by eight echoes that slow down, spread to both sides and sink a shade each, squashed flat after.',
    preview: EIGHT_OFF,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: {
        volume: -14,
        position: 0.35,
        bright: 0.45,
        decay: 0.55,
        air: 0.35,
        release: 0.3,
        wander: 0,
        width: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Slowing bounces',
        params: { first: 110, bounce: 1.15, skips: 8, loss: 2.2, drop: 8, mix: 0.5 },
      },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-full-weight-slow-bow',
    name: 'Full weight, slow bow',
    category: 'drone',
    description:
      'A string under all the pressure there is, bowed slowly near its end on a low D and A, with iron lows and a moving beat on top.',
    preview: FIFTHS_LOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        volume: -17,
        pressure: 1,
        position: 0.1,
        bright: 0.7,
        air: 0.45,
        swell: 0.5,
        release: 1.2,
        wander: 0.8,
        width: 0.7,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-stick-on-a-bowl-rim',
    name: 'Stick on a bowl rim',
    category: 'bell',
    description:
      'The wood of the bow let fall on a metal bowl, a dull short knock and a longer hum, its strikes made later than its tone.',
    preview: DOWN_BOWS,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        volume: 0.5,
        pressure: 0.4,
        position: 0.45,
        bright: 0.5,
        decay: 4,
        air: 0.5,
        release: 3,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strike just after', params: { late: 90 } },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'ten-ways-to-bow-bow-on-the-tailpiece',
    name: 'Bow on the tailpiece',
    category: 'drone',
    description:
      'A bow drawn over a stopped pipe so hard that it breaks up to the twelfth, dark above, rising and falling on breaths of six seconds.',
    preview: FIFTHS_LOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        volume: -14.5,
        pressure: 0.95,
        position: 0.3,
        bright: 0.6,
        air: 0.1,
        swell: 0.6,
        release: 1.2,
        wander: 0.7,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Dark lungs', params: { in: 2.5, out: 3, depth: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'ten-ways-to-bow-left-hand-under-the-bow',
    name: 'Left hand under the bow',
    category: 'plucked',
    description:
      'A string plucked near its end and left to ring five seconds, its pluck half hidden by a fast swell as if a bow arrived to take it.',
    preview: ROCKED,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked string',
      params: {
        volume: -1.5,
        pressure: 0.45,
        position: 0.12,
        bright: 0.45,
        decay: 5,
        air: 0.1,
        release: 1.5,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 160, mix: 0.6 } },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  // string-machine
  {
    id: 'ten-ways-to-bow-saws-over-the-board',
    name: 'Saws over the board',
    category: 'pad',
    description:
      'The low octave and the key alone, cut off at seven hundred hertz, the ensemble slowed until it hardly turns, in a dark wide hall.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: {
        attack: 2,
        release: 3.5,
        low: 0.5,
        high: 0,
        tone: 700,
        ensemble: 0.9,
        speed: 0.3,
        drift: 0.5,
        width: 1,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { damping: 2200, mix: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-single-saw-no-rosin',
    name: 'Single saw, no rosin',
    category: 'string',
    description:
      'One dry sawtooth with no ensemble and its top shut, a late slow vibrato swaying it, in a small wooden body.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        volume: -3,
        attack: 0.12,
        release: 0.4,
        low: 0,
        high: 0,
        tone: 1300,
        ensemble: 0,
        drift: 0.2,
        width: 0,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 200, grow: 450, depth: 22 } },
      { deviceId: 'vessel', preset: 'Hint of wood', params: { size: 0.5, mix: 0.65 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-flautando-three-wheels',
    name: 'Flautando, three wheels',
    category: 'pad',
    description:
      'Upper octave over the key through a soft filter, the three chorus wheels turning slowly, attacks softened, hiss riding on the notes.',
    preview: EIGHT_SLURRED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: {
        volume: -2.5,
        attack: 0.25,
        release: 1,
        low: 0,
        high: 0.6,
        tone: 1900,
        ensemble: 1,
        speed: 0.35,
        drift: 0.3,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'noise-floor', preset: 'Riding hiss', params: { level: -34 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-flute-tone-one-wheel',
    name: 'Flute tone, one wheel',
    category: 'wind',
    description:
      'The key and its upper octave under a low filter, hardly any chorus, with the soft chiff of flute pipes speaking a little after it.',
    preview: EIGHT,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: {
        attack: 0.09,
        release: 0.35,
        low: 0,
        high: 0.5,
        tone: 800,
        ensemble: 0.15,
        speed: 0.6,
        drift: 0.1,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { sub: 0, octave: 0.3, unison: 0.9 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-wheels-at-the-bridge',
    name: 'Wheels at the bridge',
    category: 'string',
    description:
      'The key and its high octave, the filter wide open and a fast deep ensemble, everything under a kilohertz taken away, shaking in pairs.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: {
        volume: -6,
        attack: 0.1,
        release: 0.8,
        low: 0,
        high: 1,
        tone: 11000,
        ensemble: 1,
        speed: 2,
        drift: 0.3,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 1000 } },
      { deviceId: 'pulses', preset: 'Soft throb', params: { rate: 13, floor: 0.55, accent: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-glass-saw-on-the-bridge',
    name: 'Glass saw on the bridge',
    category: 'string',
    description:
      'A dry saw and its upper octave with the lows thinned, a resonant peak that follows how hard it is played, and a bright tight plate.',
    preview: EIGHT,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: {
        volume: -13,
        attack: 0.03,
        release: 0.3,
        low: 0,
        high: 1,
        tone: 9000,
        ensemble: 0,
        drift: 0,
        width: 0,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { cutoffHz: 3000, resonance: 2 },
      },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 9000 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-wooden-mutes-back-desks',
    name: 'Wooden mutes, back desks',
    category: 'pad',
    description:
      'All three octaves behind a filter at eleven hundred hertz, made nasal by a smaller body and set some way off, dulled by the air between.',
    preview: DOWN_BOWS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: {
        volume: -5,
        attack: 0.12,
        release: 0.9,
        low: 0.5,
        high: 0.5,
        tone: 1100,
        ensemble: 0.6,
        speed: 0.8,
        drift: 0.4,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { size: -0.75 } },
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.45 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-practice-mute-one-saw',
    name: 'Practice mute, one saw',
    category: 'string',
    description:
      'A lone sawtooth with the filter nearly closed, put through a pillow speaker, its faint top then turned up frequency by frequency.',
    preview: EIGHT,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        volume: -1,
        attack: 0.08,
        release: 0.3,
        low: 0.2,
        high: 0,
        tone: 450,
        ensemble: 0.1,
        speed: 0.4,
        drift: 0.1,
        width: 0,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { treble: -0.3 } },
      { deviceId: 'reveal', preset: 'Cling' },
    ],
  },
  {
    id: 'ten-ways-to-bow-struck-saws-dry-wood',
    name: 'Struck saws, dry wood',
    category: 'plucked',
    description:
      'Short saws with no ensemble, their strikes turned into knocks by a small drum head that rings with each of them.',
    preview: THROWN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        volume: -2,
        attack: 0.005,
        release: 0.06,
        low: 0,
        high: 0.2,
        tone: 2600,
        ensemble: 0,
        drift: 0,
        width: 0,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Drum head', params: { size: 0.7, mix: 0.85 } }],
  },
  {
    id: 'ten-ways-to-bow-sticks-from-every-stand',
    name: 'Sticks from every stand',
    category: 'plucked',
    description:
      'Three short octaves of saw with a wide ensemble, every one split into colours that arrive low to high like stands falling in late.',
    preview: STOPPED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: {
        volume: -7,
        attack: 0.005,
        release: 0.08,
        low: 0.6,
        high: 0.8,
        tone: 3600,
        ensemble: 0.9,
        speed: 1.6,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'prism', params: { time: 140, feedback: 0.15, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'ten-ways-to-bow-wood-drawn-across-wheels',
    name: 'Wood drawn across wheels',
    category: 'texture',
    description:
      'A thin high saw almost filtered away, hiss that rides with the notes in its place, and the whole of it wavering in many bands.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: {
        volume: 4.5,
        attack: 0.6,
        release: 1.2,
        low: 0,
        high: 0.7,
        tone: 2500,
        ensemble: 0.5,
        speed: 1.5,
        drift: 0.8,
        width: 0.6,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 1400 } },
      {
        deviceId: 'noise-floor',
        preset: 'Riding hiss',
        params: { level: -20, follow: 1, tone: -0.3, response: 0.3 },
      },
      { deviceId: 'glimmer', preset: 'Fast shimmer' },
    ],
  },
  {
    id: 'ten-ways-to-bow-touched-at-the-half',
    name: 'Touched at the half',
    category: 'bell',
    description:
      'The key and a strong high octave, plain and steady, every partial left hanging clean in the air after the finger is lifted.',
    preview: TOUCHED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: {
        volume: -13.5,
        attack: 0.08,
        release: 1,
        low: 0,
        high: 0.9,
        tone: 1500,
        ensemble: 0.1,
        speed: 0.3,
        drift: 0,
        width: 0.4,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { tilt: 1, mix: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-a-whistle-in-the-fifths',
    name: 'A whistle in the fifths',
    category: 'drone',
    description:
      'The three octaves held as one drone while a narrow resonance glides from harmonic to harmonic of D above it, up and down.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: {
        attack: 1,
        release: 2,
        low: 0.8,
        high: 0.6,
        tone: 4200,
        ensemble: 0.6,
        speed: 0.5,
        drift: 0.2,
        width: 0.7,
      },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Overtone melody',
        params: { root: 2, pace: 1.6, glide: 180, drone: 0.7, low: 4, high: 12 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-every-wheel-in-tremolo',
    name: 'Every wheel in tremolo',
    category: 'string',
    description:
      'A wide detuned section in unmeasured tremolo: random steps of level ten times a second, different left and right.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: {
        attack: 0.3,
        release: 1.4,
        low: 0.3,
        high: 0.6,
        tone: 3200,
        ensemble: 1,
        speed: 1.8,
        drift: 1,
        width: 1,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 10, depth: 0.9, shape: 3, phase: 180, drift: 0.9, smooth: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'ten-ways-to-bow-measured-sixteenths',
    name: 'Measured sixteenths',
    category: 'string',
    description:
      'Nearly dry violas chopped evenly into sixteenths with a hard edge, the first of each four marked, under dotted echoes in time.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: {
        attack: 0.01,
        release: 0.15,
        low: 0.1,
        high: 0.2,
        tone: 2800,
        ensemble: 0.3,
        speed: 1,
        drift: 0.1,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Marked fours', params: { rate: 8, floor: 0.2, drift: 0 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 375, feedback: 0.4, mix: 0.25 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-wheels-on-one-breath',
    name: 'Wheels on one breath',
    category: 'pad',
    description:
      'A soft low saw ensemble let in by one breath at a time, opening in level, width and brightness together and closing to almost nothing.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: {
        attack: 0.6,
        release: 2,
        low: 0.4,
        high: 0.3,
        tone: 1300,
        ensemble: 0.8,
        speed: 0.25,
        drift: 0.4,
        width: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Held then let go',
        params: { in: 1.6, hold: 0.6, out: 1.8, depth: 0.85, air: 0.8 },
      },
      { deviceId: 'fog', preset: 'Pad softener' },
    ],
  },
  {
    id: 'ten-ways-to-bow-wheels-stopped-by-hand',
    name: 'Wheels stopped by hand',
    category: 'string',
    description:
      'Short full chords of saw, pressed flat by a limiter and answered by a gated room that steps away in level and stops.',
    preview: STOPPED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        attack: 0.005,
        release: 0.1,
        low: 0.6,
        high: 0.3,
        tone: 4200,
        ensemble: 0.5,
        speed: 1.2,
        drift: 0.2,
        width: 0.6,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'shaped-reverb', preset: 'Gate steps', params: { mix: 0.35, repeat: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-bow-let-fall-and-bounce',
    name: 'Bow let fall and bounce',
    category: 'plucked',
    description:
      'Short saws with the top shaded that bounce from side to side on echoes coming closer together, each softer and duller than the last.',
    preview: STOPPED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        attack: 0.005,
        release: 0.12,
        low: 0.2,
        high: 0.5,
        tone: 5000,
        ensemble: 0.2,
        speed: 1,
        drift: 0.1,
        width: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Wide rings',
        params: { first: 260, bounce: 0.72, skips: 9, loss: 2, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'ten-ways-to-bow-ground-into-the-string',
    name: 'Ground into the string',
    category: 'bass',
    description:
      'The octave below and the key, dry, driven hard by a pentode stage and worked through a fast stepping phaser: the pressed low bow.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: {
        attack: 0.04,
        release: 0.3,
        low: 1,
        high: 0,
        tone: 1400,
        ensemble: 0.1,
        speed: 0.3,
        drift: 0.5,
        width: 0.1,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.8 } },
      { deviceId: 'phaser', preset: 'Two-tone flip', params: { rate: 6, mix: 0.35 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-a-hundred-bows-leaning',
    name: 'A hundred bows leaning',
    category: 'pad',
    description:
      'Every octave with the filter wide and the ensemble at its deepest, glued by a warm overdrive and held level by a heavy compressor.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: {
        attack: 0.9,
        release: 2.4,
        low: 1,
        high: 0.7,
        tone: 7500,
        ensemble: 1,
        speed: 0.7,
        drift: 0.8,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 14, outputDb: -10 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 8 } },
    ],
  },
  // bowed-string
  {
    id: 'ten-ways-to-bow-far-up-the-fingerboard',
    name: 'Far up the fingerboard',
    category: 'string',
    description:
      'A waveguide string bowed near its middle with almost no pressure, dark and bodiless, entering over two seconds into a warm undertow.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: {
        attack: 2,
        release: 3.5,
        brightness: 0.05,
        position: 0.48,
        pressure: 0.05,
        body: 0.1,
        vibrato: 0,
        detune: 5,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 6, mix: 0.45 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-gut-over-the-fingerboard',
    name: 'Gut over the fingerboard',
    category: 'string',
    description:
      'One bowed string close by, mid-string and soft in a full wooden body, its vibrato slow and its top kept under two kilohertz.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.15,
        release: 0.4,
        brightness: 0.25,
        position: 0.38,
        pressure: 0.25,
        body: 1,
        vibrato: 0.35,
        vibratoRate: 4,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 2000 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'ten-ways-to-bow-flautando-one-long-bow',
    name: 'Flautando, one long bow',
    category: 'wind',
    description:
      'A bow with no weight at all, its octave brought up beside it by a soft second voice, breathing in and out with the arm.',
    preview: EIGHT_SLURRED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: {
        attack: 0.4,
        release: 1,
        brightness: 0.35,
        position: 0.3,
        pressure: 0,
        body: 0.05,
        vibrato: 0.1,
        vibratoRate: 5,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.5, attack: 0.2 } },
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 1.5, out: 2 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-light-bows-abreast',
    name: 'Light bows abreast',
    category: 'pad',
    description:
      'A weightless bow made many by wide detuning and a slow three-voice chorus, with its air sifted to the edges.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: {
        volume: -3.5,
        attack: 0.9,
        release: 2,
        brightness: 0.5,
        position: 0.25,
        pressure: 0.05,
        body: 0.3,
        vibrato: 0,
        detune: 25,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'sift', preset: 'Wide air' },
    ],
  },
  {
    id: 'ten-ways-to-bow-bow-hair-on-bare-wood',
    name: 'Bow hair on bare wood',
    category: 'string',
    description:
      'A bright bow two hundredths of the way along the string, hard pressed, no body, its low end cut and its ringing tones evened out.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        volume: 2.5,
        attack: 0.05,
        release: 0.3,
        brightness: 1,
        position: 0.02,
        pressure: 0.7,
        body: 0,
        vibrato: 0,
        detune: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 450, highCut: 8000 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  {
    id: 'ten-ways-to-bow-ice-bow-trembling',
    name: 'Ice bow, trembling',
    category: 'string',
    description:
      'A glassy bow at the bridge, detuned into a small section, its overtones turned up and flickering nine times a second in narrow bands.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: {
        attack: 0.6,
        release: 1.8,
        brightness: 1,
        position: 0.02,
        pressure: 0.6,
        body: 0.1,
        vibrato: 0,
        detune: 14,
      },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { rate: 9, lean: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'ten-ways-to-bow-con-sordino-inner-voice',
    name: 'Con sordino, inner voice',
    category: 'string',
    description:
      "A bowed string with nearly all its brightness taken away and a strong body, the mute's nasal peak added by a still filter.",
    preview: EIGHT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.12,
        release: 0.4,
        brightness: 0.05,
        position: 0.12,
        pressure: 0.4,
        body: 0.7,
        vibrato: 0.3,
        vibratoRate: 6,
        detune: 0,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { cutoffHz: 1300, resonance: 1.5, envAmount: 0 },
      },
      { deviceId: 'distance', preset: 'A few steps back', params: { wander: 0 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-low-desks-mutes-on',
    name: 'Low desks, mutes on',
    category: 'pad',
    description:
      'A detuned bowed section in mutes, its body made larger and its top taken down, circling in a slow figure of eight.',
    preview: FIFTHS_LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: {
        attack: 1.2,
        release: 3,
        brightness: 0.5,
        position: 0.1,
        pressure: 0.5,
        body: 0.6,
        vibrato: 0.2,
        vibratoRate: 4,
        detune: 22,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { size: 0.3 } },
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.3 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-legno-one-tap-a-note',
    name: 'Legno, one tap a note',
    category: 'plucked',
    description:
      'A damped pluck stands in for the stick: no sustain, full body, the tap sifted up over the tone and knocked into a coil of spring.',
    preview: EIGHT_OFF,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { volume: -1.5, brightness: 0.3, decay: 0.5, position: 0.2, body: 1, release: 0.1 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strikes forward', params: { tones: -9, attacks: 5 } },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.25, decay: 1.2 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-taps-that-rub-the-string',
    name: 'Taps that rub the string',
    category: 'plucked',
    description:
      'Plucks with a wide detune and a longer ring, each repeated by three heads of tape and pressed by a limiter into a row of sticks.',
    preview: THROWN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: {
        volume: 1,
        brightness: 0.65,
        decay: 2,
        position: 0.08,
        body: 0.6,
        detune: 20,
        release: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 210, feedback: 0.15, mix: 0.4 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 18, outputGain: -11 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-stick-drawn-sideways',
    name: 'Stick drawn sideways',
    category: 'texture',
    description:
      'A raspy bow reduced to its scrape: the note filtered to a band at eighteen hundred hertz with static riding on each stroke.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        volume: -0.5,
        attack: 0.5,
        release: 0.9,
        brightness: 0.9,
        position: 0.03,
        pressure: 0.9,
        body: 0.2,
        vibrato: 0,
        detune: 8,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Phone line',
        params: { cutoffHz: 1800, driveDb: 3, resonance: 1.2 },
      },
      {
        deviceId: 'noise-floor',
        preset: 'Static notes',
        params: { level: -30, tone: -0.2, response: 0.3 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-half-touched-octave',
    name: 'Half-touched octave',
    category: 'bell',
    description:
      'A string held by a sustainer until its octave sings above the fundamental, no body, left ringing in strings that learn its notes.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: {
        volume: -21,
        attack: 0.15,
        release: 2.5,
        brightness: 0.7,
        position: 0.3,
        pressure: 1,
        body: 0,
        vibrato: 0,
        detune: 2,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor wash',
        params: { root: 2, mode: 2, strings: 8, decay: 4, mix: 0.3 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-bow-arm-out-of-breath',
    name: 'Bow arm out of breath',
    category: 'string',
    description:
      'A short-bowed string in a shuddering tremolo, sixteen a second between left and right, its level swelling at random.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.08,
        release: 0.4,
        brightness: 0.6,
        position: 0.16,
        pressure: 0.45,
        body: 0.6,
        vibrato: 0,
        detune: 10,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Side to side',
        params: { rate: 16, depth: 0.9, shape: 1, drift: 0.8 },
      },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.6, depth: 0.6 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-last-hair-of-the-bow',
    name: 'Last hair of the bow',
    category: 'string',
    description:
      'A sustained string with almost no force, high over an open fifth, melting a little flat as it fades and darkening as it goes.',
    preview: EIGHT_HIGH,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: {
        attack: 0.35,
        release: 2.5,
        brightness: 0.3,
        position: 0.4,
        pressure: 0.02,
        body: 0.2,
        detune: 4,
      },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.45 } },
      { deviceId: 'lift', preset: 'Just the ends' },
    ],
  },
  {
    id: 'ten-ways-to-bow-hammered-bow-dry-hall',
    name: 'Hammered bow, dry hall',
    category: 'string',
    description:
      'Hard bow strokes cut off at once, their attacks squashed and set in front of a slap of room that comes a tenth of a second late.',
    preview: DOWN_BOWS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.01,
        release: 0.08,
        brightness: 0.6,
        position: 0.12,
        pressure: 0.75,
        body: 0.8,
        vibrato: 0,
        detune: 6,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'ten-ways-to-bow-bounced-off-the-octave',
    name: 'Bounced off the octave',
    category: 'plucked',
    description:
      'Plucks tossed up by an echo that hops an octave on every other repeat, the stick leaving the string again and again.',
    preview: ROCKED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { release: 0.7, brightness: 0.5, decay: 1.5, position: 0.2, body: 0.8, detune: 2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { time: 200, feedback: 0.4, mix: 0.3 },
      },
    ],
  },
  {
    id: 'ten-ways-to-bow-overbowed-low-string',
    name: 'Overbowed low string',
    category: 'drone',
    description:
      'The bow pressed past what the string can bear, shifted a hertz apart left and right so the low fifth beats against itself.',
    preview: FIFTHS_LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        volume: -15,
        attack: 0.5,
        release: 1.2,
        brightness: 0.75,
        position: 0.08,
        pressure: 1,
        body: 0.9,
        vibrato: 0.1,
        detune: 20,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { fine: 1 } },
      { deviceId: 'analog-drive', preset: 'Console' },
    ],
  },
  // dusk
  {
    id: 'ten-ways-to-bow-tasto-two-lines-apart',
    name: 'Tasto, two lines apart',
    category: 'pad',
    description:
      'One saw and its moving pulse behind a low filter, a deep sub under it, both chorus lines turning: the soft bow of a whole floor.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: {
        wave: 4,
        sub: 0.6,
        cutoff: 420,
        resonance: 0.05,
        envelope: 0.1,
        attack: 1.6,
        release: 3.5,
        chorus: 3,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 4, mix: 0.35 } }],
  },
  {
    id: 'ten-ways-to-bow-bridge-bow-one-thin-saw',
    name: 'Bridge bow, one thin saw',
    category: 'string',
    description:
      'A thin saw with its lows cut deep and its filter open, the band above four hundred hertz trembling twelve times a second.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin shimmer',
      params: {
        volume: 0,
        wave: 0,
        lowCut: 3,
        cutoff: 9000,
        attack: 0.12,
        release: 0.7,
        chorus: 1,
      },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Eight up high', params: { rate: 12, depth: 1 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { lowCut: 300, air: 3 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-muted-with-the-filter',
    name: 'Muted with the filter',
    category: 'string',
    description:
      'Saw and pulse shut to a nasal middle by a resonant filter, no chorus, each note swaying late, like one viola with a heavy mute.',
    preview: EIGHT,
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: {
        volume: 0.5,
        wave: 4,
        lowCut: 1,
        cutoff: 900,
        resonance: 0.55,
        envelope: 0.15,
        attack: 0.09,
        release: 0.35,
        chorus: 0,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'ten-ways-to-bow-filter-bitten-off',
    name: 'Filter bitten off',
    category: 'plucked',
    description:
      'Short chords with a filter that opens and drops, each one caught by a limiter and gone into a soft long bloom.',
    preview: STOPPED,
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: {
        wave: 0,
        sub: 0.2,
        cutoff: 350,
        resonance: 0.3,
        envelope: 0.75,
        attack: 0.003,
        release: 0.12,
        chorus: 1,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 1.4, mix: 0.4 } },
    ],
  },
  {
    id: 'ten-ways-to-bow-singing-node-of-the-a',
    name: 'Singing node of the A',
    category: 'bell',
    description:
      'The filter itself sings as the harmonic: a resonant twelfth over each key, a square wave left faint below and a still halo after.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: {
        wave: 1,
        lowCut: 3,
        cutoff: 785,
        resonance: 0.95,
        envelope: 0,
        attack: 0.2,
        release: 2,
        chorus: 0,
      },
    },
    effects: [{ deviceId: 'melt', preset: 'Still halo' }],
  },
  // flock
  {
    id: 'ten-ways-to-bow-bows-gather-on-one-d',
    name: 'Bows gather on one D',
    category: 'pad',
    description:
      'Eight voices a note fly in from all round over a second and a half and settle on the chord like a section finding its one string.',
    preview: FIFTHS_ENTER,
    instrument: {
      deviceId: 'flock',
      preset: 'Slow arrival',
      params: {
        birds: 8,
        gather: 1.5,
        from: 2,
        stray: 0.12,
        flutter: 0.4,
        tone: 0.75,
        octaves: 0,
        leave: 2.5,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer', params: { highCut: 5000 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'ten-ways-to-bow-harmonic-slid-from-above',
    name: 'Harmonic slid from above',
    category: 'bell',
    description:
      'Two near-sine voices slide down onto each touched node from above, chirping a little, and scatter slowly when the finger lifts.',
    preview: TOUCHED,
    instrument: {
      deviceId: 'flock',
      preset: 'Falling in',
      params: {
        volume: -13.5,
        birds: 2,
        gather: 0.35,
        from: 1,
        stray: 0.08,
        tone: 0.05,
        chirp: 0.25,
        octaves: 0,
        leave: 2,
        width: 0.8,
      },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Short halo', params: { root: 2, mode: 2 } }],
  },
  {
    id: 'ten-ways-to-bow-each-desk-its-own-shake',
    name: 'Each desk its own shake',
    category: 'texture',
    description:
      'Six quick voices that flutter seven times a second round every note, reedy, thin below, as if each desk shook at its own rate.',
    preview: FIFTHS_HELD,
    instrument: {
      deviceId: 'flock',
      preset: 'Nervous swarm',
      params: {
        birds: 6,
        gather: 0.2,
        from: 2,
        stray: 0.4,
        flutter: 7,
        tone: 0.9,
        octaves: 0.1,
        leave: 0.7,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 350 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
]
