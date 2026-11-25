import { type FactoryPreset, type Phrase } from '../types'

// One voice inside a held chord walks by half steps while the rest stay. Laid out by where that
// voice sits in the sound: the brightest string of a tine or a felt piano, the darkest of strings
// and basses, a glow or a filter on the pads. Phrases come in pairs that make eight-chord descents.

// Am, Am(maj7), Am7, Am6: A G# G F# in the tenor over A2 and an open E, C and E answering.
const AM_STEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 6, note: 52, gain: 0.3 },
    { atSec: 0, durSec: 1.5, note: 57, gain: 0.6 },
    { atSec: 0.5, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 1, durSec: 0.5, note: 64, gain: 0.35 },
    { atSec: 1.5, durSec: 1.5, note: 56, gain: 0.6 },
    { atSec: 2, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 2.5, durSec: 0.5, note: 64, gain: 0.35 },
    { atSec: 3, durSec: 3, note: 45, gain: 0.45 },
    { atSec: 3, durSec: 1.5, note: 55, gain: 0.6 },
    { atSec: 3.5, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 4, durSec: 0.5, note: 64, gain: 0.35 },
    { atSec: 4.5, durSec: 1.5, note: 54, gain: 0.6 },
    { atSec: 5, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 5.5, durSec: 0.5, note: 64, gain: 0.35 },
  ],
}

// Its answer, F, Fmaj7, F7, F6: the line goes on F E E flat D over F2, C held over from before and A above it.
const F_STEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 53, gain: 0.6 },
    { atSec: 0.5, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 1, durSec: 0.5, note: 69, gain: 0.35 },
    { atSec: 1.5, durSec: 1.5, note: 52, gain: 0.6 },
    { atSec: 2, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 2.5, durSec: 0.5, note: 69, gain: 0.35 },
    { atSec: 3, durSec: 3, note: 41, gain: 0.45 },
    { atSec: 3, durSec: 1.5, note: 51, gain: 0.6 },
    { atSec: 3.5, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 4, durSec: 0.5, note: 69, gain: 0.35 },
    { atSec: 4.5, durSec: 1.5, note: 50, gain: 0.6 },
    { atSec: 5, durSec: 1, note: 60, gain: 0.35 },
    { atSec: 5.5, durSec: 0.5, note: 69, gain: 0.35 },
  ],
}

// Dm, Dm(maj7), Dm7, Dm6: D C# C B between a held A and F, over D3.
const DM_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 50, gain: 0.36 },
    { atSec: 0, durSec: 3.4, note: 69, gain: 0.36 },
    { atSec: 0, durSec: 1.7, note: 74, gain: 0.58 },
    { atSec: 0, durSec: 3.4, note: 77, gain: 0.36 },
    { atSec: 1.7, durSec: 1.7, note: 73, gain: 0.58 },
    { atSec: 3.4, durSec: 3.4, note: 50, gain: 0.36 },
    { atSec: 3.4, durSec: 3.4, note: 69, gain: 0.36 },
    { atSec: 3.4, durSec: 1.7, note: 72, gain: 0.58 },
    { atSec: 3.4, durSec: 3.4, note: 77, gain: 0.36 },
    { atSec: 5.1, durSec: 1.7, note: 71, gain: 0.58 },
  ],
}

// Its answer, B flat, B flat maj7, 7 and 6: the line goes on B flat A A flat G between F and D.
const BB_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 46, gain: 0.36 },
    { atSec: 0, durSec: 3.4, note: 65, gain: 0.36 },
    { atSec: 0, durSec: 1.7, note: 70, gain: 0.58 },
    { atSec: 0, durSec: 3.4, note: 74, gain: 0.36 },
    { atSec: 1.7, durSec: 1.7, note: 69, gain: 0.58 },
    { atSec: 3.4, durSec: 3.4, note: 46, gain: 0.36 },
    { atSec: 3.4, durSec: 3.4, note: 65, gain: 0.36 },
    { atSec: 3.4, durSec: 1.7, note: 68, gain: 0.58 },
    { atSec: 3.4, durSec: 3.4, note: 74, gain: 0.36 },
    { atSec: 5.1, durSec: 1.7, note: 67, gain: 0.58 },
  ],
}

// Em, Em(maj7), Em7, Em6 held whole: E D# D C# under a G, over a low E and B.
const EM_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 40, gain: 0.35 },
    { atSec: 0, durSec: 6.8, note: 47, gain: 0.35 },
    { atSec: 0, durSec: 6.8, note: 55, gain: 0.35 },
    { atSec: 0, durSec: 6.8, note: 59, gain: 0.35 },
    { atSec: 0, durSec: 1.7, note: 64, gain: 0.58 },
    { atSec: 0, durSec: 6.8, note: 67, gain: 0.35 },
    { atSec: 1.7, durSec: 1.7, note: 63, gain: 0.58 },
    { atSec: 3.4, durSec: 1.7, note: 62, gain: 0.58 },
    { atSec: 5.1, durSec: 1.7, note: 61, gain: 0.58 },
  ],
}

// Its answer, C, Cmaj7, C7, C6 held whole: the line goes on C B B flat A inside E and G.
const C_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 48, gain: 0.35 },
    { atSec: 0, durSec: 6.8, note: 55, gain: 0.35 },
    { atSec: 0, durSec: 1.7, note: 60, gain: 0.58 },
    { atSec: 0, durSec: 6.8, note: 64, gain: 0.35 },
    { atSec: 0, durSec: 6.8, note: 67, gain: 0.35 },
    { atSec: 1.7, durSec: 1.7, note: 59, gain: 0.58 },
    { atSec: 3.4, durSec: 1.7, note: 58, gain: 0.58 },
    { atSec: 5.1, durSec: 1.7, note: 57, gain: 0.58 },
  ],
}

// The major line that rises: C, Caug, C6, C7, with G G# A B flat between E and C.
const C_RISE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 67, gain: 0.6 },
    { atSec: 0.375, durSec: 1.125, note: 64, gain: 0.35 },
    { atSec: 0.75, durSec: 0.75, note: 72, gain: 0.35 },
    { atSec: 1.5, durSec: 1.5, note: 68, gain: 0.6 },
    { atSec: 1.875, durSec: 1.125, note: 64, gain: 0.35 },
    { atSec: 2.25, durSec: 0.75, note: 72, gain: 0.35 },
    { atSec: 3, durSec: 3, note: 48, gain: 0.45 },
    { atSec: 3, durSec: 1.5, note: 69, gain: 0.6 },
    { atSec: 3.375, durSec: 1.125, note: 64, gain: 0.35 },
    { atSec: 3.75, durSec: 0.75, note: 72, gain: 0.35 },
    { atSec: 4.5, durSec: 1.5, note: 70, gain: 0.6 },
    { atSec: 4.875, durSec: 1.125, note: 64, gain: 0.35 },
    { atSec: 5.25, durSec: 0.75, note: 72, gain: 0.35 },
  ],
}

// Its answer, F, Faug, F6, F7: E goes to F and B flat to A, and C C# D E flat climbs under a high
// F.
const F_RISE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 72, gain: 0.6 },
    { atSec: 0.25, durSec: 1.25, note: 65, gain: 0.35 },
    { atSec: 0.5, durSec: 1, note: 69, gain: 0.35 },
    { atSec: 1, durSec: 0.5, note: 77, gain: 0.35 },
    { atSec: 1.5, durSec: 1.5, note: 73, gain: 0.6 },
    { atSec: 1.75, durSec: 1.25, note: 65, gain: 0.35 },
    { atSec: 2, durSec: 1, note: 69, gain: 0.35 },
    { atSec: 2.5, durSec: 0.5, note: 77, gain: 0.35 },
    { atSec: 3, durSec: 3, note: 53, gain: 0.45 },
    { atSec: 3, durSec: 1.5, note: 74, gain: 0.6 },
    { atSec: 3.25, durSec: 1.25, note: 65, gain: 0.35 },
    { atSec: 3.5, durSec: 1, note: 69, gain: 0.35 },
    { atSec: 4, durSec: 0.5, note: 77, gain: 0.35 },
    { atSec: 4.5, durSec: 1.5, note: 75, gain: 0.6 },
    { atSec: 4.75, durSec: 1.25, note: 65, gain: 0.35 },
    { atSec: 5, durSec: 1, note: 69, gain: 0.35 },
    { atSec: 5.5, durSec: 0.5, note: 77, gain: 0.35 },
  ],
}

// Bass alone: the pedal A, and after it each time A, G#, G, F#, an octave that closes to a 6th.
const PEDAL_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 33, gain: 0.6 },
    { atSec: 0.8, durSec: 0.75, note: 45, gain: 0.55 },
    { atSec: 1.6, durSec: 0.75, note: 33, gain: 0.6 },
    { atSec: 2.4, durSec: 0.75, note: 44, gain: 0.55 },
    { atSec: 3.2, durSec: 0.75, note: 33, gain: 0.6 },
    { atSec: 4, durSec: 0.75, note: 43, gain: 0.55 },
    { atSec: 4.8, durSec: 0.75, note: 33, gain: 0.6 },
    { atSec: 5.6, durSec: 0.75, note: 42, gain: 0.55 },
  ],
}

// Two basses: A under A, G#, G, and then the low one takes the F# itself, so Am6 is F#m7b5.
const BASS_JOINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 33, gain: 0.5 },
    { atSec: 0, durSec: 1.55, note: 45, gain: 0.5 },
    { atSec: 1.6, durSec: 1.55, note: 33, gain: 0.5 },
    { atSec: 1.6, durSec: 1.55, note: 44, gain: 0.5 },
    { atSec: 3.2, durSec: 1.55, note: 33, gain: 0.5 },
    { atSec: 3.2, durSec: 1.55, note: 43, gain: 0.5 },
    { atSec: 4.8, durSec: 1.9, note: 30, gain: 0.6 },
    { atSec: 5.2, durSec: 0.35, note: 45, gain: 0.45 },
    { atSec: 5.6, durSec: 1.1, note: 48, gain: 0.45 },
    { atSec: 6, durSec: 0.7, note: 52, gain: 0.45 },
  ],
}

// Bass alone in three: root, fifth and the line, D C# C B over a D that stays.
const DM_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 38, gain: 0.6 },
    { atSec: 0.533, durSec: 0.5, note: 45, gain: 0.4 },
    { atSec: 1.067, durSec: 0.52, note: 50, gain: 0.55 },
    { atSec: 1.6, durSec: 0.5, note: 38, gain: 0.6 },
    { atSec: 2.133, durSec: 0.5, note: 45, gain: 0.4 },
    { atSec: 2.667, durSec: 0.52, note: 49, gain: 0.55 },
    { atSec: 3.2, durSec: 0.5, note: 38, gain: 0.6 },
    { atSec: 3.733, durSec: 0.5, note: 45, gain: 0.4 },
    { atSec: 4.267, durSec: 0.52, note: 48, gain: 0.55 },
    { atSec: 4.8, durSec: 0.5, note: 38, gain: 0.6 },
    { atSec: 5.333, durSec: 0.5, note: 45, gain: 0.4 },
    { atSec: 5.867, durSec: 1, note: 47, gain: 0.55 },
  ],
}

// The eight-chord descent for a bass alone: A G# G F# and then F E E flat D on the beat, and after
// each the root it belongs to, four times a low A and then a low F.
const EIGHT_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.54, note: 45, gain: 0.6 },
    { atSec: 0.56, durSec: 0.27, note: 33, gain: 0.5 },
    { atSec: 0.84, durSec: 0.54, note: 44, gain: 0.6 },
    { atSec: 1.4, durSec: 0.27, note: 33, gain: 0.5 },
    { atSec: 1.68, durSec: 0.54, note: 43, gain: 0.6 },
    { atSec: 2.24, durSec: 0.27, note: 33, gain: 0.5 },
    { atSec: 2.52, durSec: 0.54, note: 42, gain: 0.6 },
    { atSec: 3.08, durSec: 0.27, note: 33, gain: 0.5 },
    { atSec: 3.36, durSec: 0.54, note: 41, gain: 0.6 },
    { atSec: 3.92, durSec: 0.27, note: 29, gain: 0.5 },
    { atSec: 4.2, durSec: 0.54, note: 40, gain: 0.6 },
    { atSec: 4.76, durSec: 0.27, note: 29, gain: 0.5 },
    { atSec: 5.04, durSec: 0.54, note: 39, gain: 0.6 },
    { atSec: 5.6, durSec: 0.27, note: 29, gain: 0.5 },
    { atSec: 5.88, durSec: 1.1, note: 38, gain: 0.6 },
  ],
}

// The A minor line for bells: A G# G F# under a high E, over A and C.
const AM_BELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 69, gain: 0.4 },
    { atSec: 0, durSec: 1.5, note: 81, gain: 0.6 },
    { atSec: 0.5, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 1, durSec: 0.5, note: 88, gain: 0.25 },
    { atSec: 1.5, durSec: 1.5, note: 80, gain: 0.6 },
    { atSec: 2, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 2.5, durSec: 0.5, note: 88, gain: 0.25 },
    { atSec: 3, durSec: 3, note: 69, gain: 0.4 },
    { atSec: 3, durSec: 1.5, note: 79, gain: 0.6 },
    { atSec: 3.5, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 4, durSec: 0.5, note: 88, gain: 0.25 },
    { atSec: 4.5, durSec: 1.5, note: 78, gain: 0.6 },
    { atSec: 5, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 5.5, durSec: 0.5, note: 88, gain: 0.25 },
  ],
}

// Its answer for bells: F E E flat D between a C that stays and the A above, over F.
const F_BELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 65, gain: 0.4 },
    { atSec: 0, durSec: 1.5, note: 77, gain: 0.6 },
    { atSec: 0.5, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 1, durSec: 0.5, note: 81, gain: 0.25 },
    { atSec: 1.5, durSec: 1.5, note: 76, gain: 0.6 },
    { atSec: 2, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 2.5, durSec: 0.5, note: 81, gain: 0.25 },
    { atSec: 3, durSec: 3, note: 65, gain: 0.4 },
    { atSec: 3, durSec: 1.5, note: 75, gain: 0.6 },
    { atSec: 3.5, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 4, durSec: 0.5, note: 81, gain: 0.25 },
    { atSec: 4.5, durSec: 1.5, note: 74, gain: 0.6 },
    { atSec: 5, durSec: 1, note: 72, gain: 0.35 },
    { atSec: 5.5, durSec: 0.5, note: 81, gain: 0.25 },
  ],
}

// All eight chords: A G# G F# over A, then F E E flat D over F, C common to them all.
const EIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 57, gain: 0.58 },
    { atSec: 0, durSec: 1.6, note: 60, gain: 0.33 },
    { atSec: 0.4, durSec: 1.2, note: 64, gain: 0.33 },
    { atSec: 0.8, durSec: 0.8, note: 56, gain: 0.58 },
    { atSec: 1.6, durSec: 0.8, note: 55, gain: 0.58 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.33 },
    { atSec: 2, durSec: 1.2, note: 64, gain: 0.33 },
    { atSec: 2.4, durSec: 0.8, note: 54, gain: 0.58 },
    { atSec: 3.2, durSec: 3.2, note: 41, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 53, gain: 0.58 },
    { atSec: 3.2, durSec: 1.6, note: 60, gain: 0.33 },
    { atSec: 3.6, durSec: 1.2, note: 69, gain: 0.33 },
    { atSec: 4, durSec: 0.8, note: 52, gain: 0.58 },
    { atSec: 4.8, durSec: 0.8, note: 51, gain: 0.58 },
    { atSec: 4.8, durSec: 1.6, note: 60, gain: 0.33 },
    { atSec: 5.2, durSec: 1.2, note: 69, gain: 0.33 },
    { atSec: 5.6, durSec: 0.8, note: 50, gain: 0.58 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'falling-inner-line-alto-by-lamplight',
    name: 'Alto by lamplight',
    category: 'keys',
    description:
      'A soft dark tine with a slow tremolo, dull echoes half a second behind it, set back across a small room.',
    preview: AM_STEP,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        bell: 0.2,
        bark: 0.25,
        tone: 0.35,
        decay: 1.5,
        release: 0.7,
        tremolo: 0.2,
        tremoloRate: 1.1,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 540, feedback: 0.25, mix: 0.24 },
      },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'falling-inner-line-sunk-a-half-step',
    name: 'Sunk a half step',
    category: 'keys',
    description:
      'Dull, endless tines taken under water with a slow swell in pitch and tone, in a dark hall.',
    preview: F_STEP,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { volume: -14.5, tone: 0.2 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Slow swell' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'falling-inner-line-raised-seventh-unsettled',
    name: 'Raised seventh unsettled',
    category: 'bell',
    description:
      'Hard glassy tines whose tops arrive before their bodies, each band on its own echo, in a bright reverb.',
    preview: DM_HIGH,
    instrument: { deviceId: 'tine-piano', preset: 'Glass bells', params: { decay: 1, release: 2 } },
    effects: [
      { deviceId: 'prism', preset: 'High to low', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'falling-inner-line-grey-note-between-two',
    name: 'Grey note between two',
    category: 'keys',
    description:
      'Felt-dark tines through the slow drum of a rotary cabinet, with a dark plate behind them.',
    preview: BB_HIGH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { tone: 0.15, decay: 2.5, release: 1.2 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-inner-line-halfway-to-b-flat',
    name: 'Halfway to B flat',
    category: 'keys',
    description:
      'Long sustained tines, slightly detuned on each side, with a reverb whose tail climbs in fifths.',
    preview: C_RISE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tone: 0.6, tremolo: 0.1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-inner-line-c-climbing-by-halves',
    name: 'C climbing by halves',
    category: 'keys',
    description:
      'Barking tines that pan slowly, through a very slow phaser and a light dotted tape echo.',
    preview: F_RISE,
    instrument: { deviceId: 'tine-piano', preset: 'Slow pan', params: { tone: 0.75, bark: 0.55 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.22, feedback: 0.35 } },
    ],
  },
  {
    id: 'falling-inner-line-tremble-on-the-f-sharp',
    name: 'Tremble on the F sharp',
    category: 'keys',
    description:
      'A deep five-a-second tremolo on warm tines, through a triode and a narrow spring tank.',
    preview: EIGHT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { volume: -14, tremolo: 0.9, tremoloRate: 5, bell: 0.2, tone: 0.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'falling-inner-line-only-the-mover-is-heard',
    name: 'Only the mover is heard',
    category: 'keys',
    description:
      'Undamped tines with the held tones turned down 15 dB, so the voice that moves stands out, in a long hall.',
    preview: EM_HELD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { volume: -2.5, bell: 0.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { floor: -15 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'falling-inner-line-what-three-voices-keep',
    name: 'What three voices keep',
    category: 'pad',
    description:
      'Soft undamped tines from which what the chords share is held on, under a slow wide chorus.',
    preview: C_HELD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.1, tone: 0.35, hardness: 0.3 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.85, ago: 700 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'falling-inner-line-four-chords-in-a-drawer',
    name: 'Four chords in a drawer',
    category: 'keys',
    description:
      'Short tines inside a small tin, with two heads of a tape echo galloping after them.',
    preview: DM_HIGH,
    instrument: { deviceId: 'tine-piano', preset: 'Short tines', params: { decay: 0.4 } },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.5 } },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.24, feedback: 0.35 } },
    ],
  },
  {
    id: 'falling-inner-line-fast-light-on-a-flat',
    name: 'Fast light on A flat',
    category: 'bell',
    description:
      'Bell tines with a nine-a-second tremolo, small glints flickering over the top and a bright long tail.',
    preview: BB_HIGH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { volume: -15.5, decay: 1.5, release: 0.8 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'falling-inner-line-slow-ache-from-the-left',
    name: 'Slow ache from the left',
    category: 'keys',
    description: 'Bright long tines swung round the head from side to side, in a hall.',
    preview: EIGHT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { tremolo: 0, tone: 0.8, bell: 0.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-inner-line-reed-where-a-tine-was',
    name: 'Reed where a tine was',
    category: 'keys',
    description:
      'Softly struck, buzzing tines pressed into the tone of a hollow tube, in a dark hall.',
    preview: EM_HELD,
    instrument: { deviceId: 'tine-piano', preset: 'Reedy flutter', params: { tremolo: 0.15 } },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-inner-line-throb-under-a-held-third',
    name: 'Throb under a held third',
    category: 'keys',
    description: 'A slow deep throb on dark tines shaped by a round vowel, with a plate after it.',
    preview: C_HELD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { decay: 4, release: 1.2 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'falling-inner-line-overheated-alto',
    name: 'Overheated alto',
    category: 'keys',
    description:
      'Overdriven tines through a slow rotary cabinet, with the lows lifted and the top taken down.',
    preview: AM_STEP,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { volume: -11.5, release: 0.6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'falling-inner-line-barked-semitone',
    name: 'Barked semitone',
    category: 'keys',
    description:
      'Tines hit hard and short, doubled by a detuned octave above, through a warm stack in a room.',
    preview: F_STEP,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { volume: -14, drive: 0.6, bell: 0.15, decay: 0.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 're-amp', preset: 'Warm stack' },
    ],
  },
  {
    id: 'falling-inner-line-a-step-heard-as-a-swell',
    name: 'A step heard as a swell',
    category: 'pad',
    description:
      'Long tines with the strike removed, each note fading in over half a second into a three-voice ensemble.',
    preview: EM_HELD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { decay: 4, release: 2.5, tone: 0.6, tremolo: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 550 } },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },
  {
    id: 'falling-inner-line-alto-in-a-great-box',
    name: 'Alto in a great box',
    category: 'pad',
    description:
      'Felt-struck tines given an enormous body, with dark strings swelling in behind the chord.',
    preview: C_HELD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.4, decay: 3, release: 2, tone: 0.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant' },
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.4, octaves: -0.2 } },
    ],
  },
  {
    id: 'falling-inner-line-tiny-box-in-a-minor',
    name: 'Tiny box in A minor',
    category: 'bell',
    description: 'Glass tines shrunk to the body of a music box, each with a short swelling halo.',
    preview: AM_BELLS,
    instrument: { deviceId: 'tine-piano', preset: 'Glass bells', params: { decay: 0.8 } },
    effects: [
      { deviceId: 'size', preset: 'Music box' },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'falling-inner-line-the-root-hums-below',
    name: 'The root hums below',
    category: 'keys',
    description:
      'Bell tines left ringing, with the octave and the double octave below filtered to a hum, in a faint hall.',
    preview: F_BELLS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.6, bark: 0.2, decay: 2, release: 1.6, tremolo: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.5, sub1: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'falling-inner-line-parlour-with-one-lamp',
    name: 'Parlour with one lamp',
    category: 'keys',
    description:
      'Plain tines cut to a fast worn record and played through a small bedside speaker.',
    preview: EIGHT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { volume: -7.5, tremolo: 0, drive: 0.5, tone: 0.8, bark: 0.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },
  {
    id: 'falling-inner-line-semitone-in-suspension',
    name: 'Semitone in suspension',
    category: 'pad',
    description:
      'Undamped bell tines smeared into a glassy hanging spectrum, then darkened and thinned as if far away.',
    preview: DM_HIGH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 1, hardness: 0.8 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'falling-inner-line-sine-under-each-step',
    name: 'Sine under each step',
    category: 'keys',
    description:
      'Short tines with a pure sine swelling behind each strong partial, the whole drifting as a slow flock.',
    preview: BB_HIGH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -11, decay: 0.5, release: 0.4, bell: 0.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Sine shadow', params: { mix: 0.65 } },
      { deviceId: 'murmuration', preset: 'Slow drift' },
    ],
  },
  {
    id: 'falling-inner-line-stars-settle-on-g-sharp',
    name: 'Stars settle on G sharp',
    category: 'keys',
    description:
      'Clean bell-like tines beating slowly against a shifted copy, with ten echoes that gather together.',
    preview: C_RISE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremolo: 0, drive: 0.1, bell: 0.8, bark: 0.1 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { fine: 1.2 } },
      { deviceId: 'constellation', preset: 'Gathering in', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'falling-inner-line-line-read-from-the-end',
    name: 'Line read from the end',
    category: 'keys',
    description:
      'Bell tines with nearly a second of them played backwards behind, the top spread wide.',
    preview: F_RISE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { volume: -13.5, decay: 2.5, bark: 0, tremolo: 0 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 900, feedback: 0.3, smooth: 0.8, mix: 0.5 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'falling-inner-line-fingers-stay-on-a',
    name: 'Fingers stay on A',
    category: 'bass',
    description:
      'Warm finger bass on thumping cassette tape, its notes evened by a slow compressor.',
    preview: PEDAL_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { tone: 0.4, touch: 0.2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'falling-inner-line-eight-stairs-to-low-d',
    name: 'Eight stairs to low D',
    category: 'bass',
    description: 'A dark upright plucked softly, heard from the back of a hall.',
    preview: EIGHT_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { mute: 0, tone: 0.3, release: 0.35 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'falling-inner-line-fretless-half-steps',
    name: 'Fretless half steps',
    category: 'bass',
    description:
      'A singing fretless with two slow chorus voices opened out to the sides, in a small room.',
    preview: DM_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: 2.5, release: 0.6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { depth: 45, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'falling-inner-line-the-floor-joins-the-line',
    name: 'The floor joins the line',
    category: 'bass',
    description: 'A round upright ringing inside a second wooden soundboard, in a tight room.',
    preview: BASS_JOINS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 8, release: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'falling-inner-line-pick-along-the-fall',
    name: 'Pick along the fall',
    category: 'bass',
    description: 'A bright picked bass answered by short tape repeats, with a hint of spring.',
    preview: PEDAL_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { volume: -0.5, sustain: 4 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 210, mix: 0.32, feedback: 0.4 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'falling-inner-line-muted-at-the-sixth',
    name: 'Muted at the sixth',
    category: 'bass',
    description: 'A palm-muted thud with two springs dripping after it, brought up by a limiter.',
    preview: DM_BASS,
    instrument: { deviceId: 'string-bass', preset: 'Muted thud', params: { volume: 6, tone: 0.2 } },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.45, decay: 3 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'falling-inner-line-bridge-between-two-as',
    name: 'Bridge between two As',
    category: 'bass',
    description:
      'A nasal bass plucked at the bridge, swept by eight phaser stages and doubled wide.',
    preview: PEDAL_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { volume: 4.5, sustain: 6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'stereo-detune', preset: 'Classic' },
    ],
  },
  {
    id: 'falling-inner-line-thumb-and-pedal-pipe',
    name: 'Thumb and pedal pipe',
    category: 'bass',
    description:
      'A thumbed bass with soft organ stops at its own pitch and an octave under it, in a dark hall.',
    preview: DM_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { volume: -0.5, release: 0.3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'falling-inner-line-four-roots-left-ringing',
    name: 'Four roots left ringing',
    category: 'bass',
    description:
      'Long bass strings damped a little late, in an enormous cathedral with only its low end left.',
    preview: BASS_JOINS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { tone: 0.7, touch: 0.3, release: 0.9 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4, decay: 8 } }],
  },
  {
    id: 'falling-inner-line-growl-at-c-sharp',
    name: 'Growl at C sharp',
    category: 'bass',
    description: 'A growling fretless folded into a dark fuzz, with a small plate.',
    preview: DM_BASS,
    instrument: { deviceId: 'string-bass', preset: 'Growling fretless', params: { tone: 0.5 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'falling-inner-line-slap-then-a-soft-door',
    name: 'Slap, then a soft door',
    category: 'bass',
    description:
      'A slapped upright whose edge is scattered into twelve close flickers, in a tight chamber.',
    preview: PEDAL_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { volume: 2.5, tone: 0.85 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'falling-inner-line-wool-on-all-four-strings',
    name: 'Wool on all four strings',
    category: 'bass',
    description: 'Dead flat strings through a woolly stack turned away from the microphone.',
    preview: EIGHT_BASS,
    instrument: { deviceId: 'string-bass', preset: 'Dark flat strings', params: { sustain: 1.2 } },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly' }],
  },
  {
    id: 'falling-inner-line-rattling-down-to-d',
    name: 'Rattling down to D',
    category: 'bass',
    description:
      'A picked bass rattling on its frets, resampled dustily, under a low-pass that opens on each note.',
    preview: EIGHT_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { volume: -4.5, sustain: 2 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 350, envAmount: 60, resonance: 2 },
      },
    ],
  },
  {
    id: 'falling-inner-line-stone-skipped-off-a',
    name: 'Stone skipped off A',
    category: 'bass',
    description:
      'A half-muted picked bass whose every note skips away in closer and duller echoes.',
    preview: PEDAL_BASS,
    instrument: { deviceId: 'string-bass', preset: 'Muted pick', params: { volume: 4, tone: 0.7 } },
    effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.5 } }],
  },
  {
    id: 'falling-inner-line-bowed-by-a-foot-pedal',
    name: 'Bowed by a foot pedal',
    category: 'string',
    description:
      'A picked open bass with the pluck taken off, each note swelling in as if bowed, in a hall.',
    preview: PEDAL_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { volume: -2.5, tone: 0.85, touch: 0.7, growl: 0.5, release: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 300 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'falling-inner-line-fretless-under-heavy-sea',
    name: 'Fretless under heavy sea',
    category: 'bass',
    description: 'A deep fretless pressed under heavy water, muffled and narrow.',
    preview: DM_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { tone: 0.7, growl: 0.8, release: 0.4 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Heavy water' }],
  },
  {
    id: 'falling-inner-line-monks-on-the-low-line',
    name: 'Monks on the low line',
    category: 'bass',
    description: 'A soft fretless in a long hall whose tail sings a low closed vowel.',
    preview: DM_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: -1, growl: 0.4, touch: 0.15, release: 0.3 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 6 } }],
  },
  {
    id: 'falling-inner-line-howl-beneath-the-third',
    name: 'Howl beneath the third',
    category: 'drone',
    description:
      'A deep fretless feeding back on itself low down, so held notes bloom, with the top shaded.',
    preview: BASS_JOINS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: -1, sustain: 20, release: 0.6 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Low drone', params: { mix: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'falling-inner-line-a-bed-the-a-left-behind',
    name: 'A bed the A left behind',
    category: 'drone',
    description: 'A short thumbed bass caught and held as a dark even bed, shimmering in tone.',
    preview: PEDAL_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { volume: 3, release: 0.08, sustain: 3 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 0.4 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
    ],
  },
  {
    id: 'falling-inner-line-comb-through-a-seventh',
    name: 'Comb through a seventh',
    category: 'bass',
    description:
      'A clear picked bass held up by a compressor, with a wide slow flanger drifting through it.',
    preview: EIGHT_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { touch: 0.5, sustain: 10, release: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
      { deviceId: 'flanger', preset: 'Wide wash', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'falling-inner-line-undertow-of-f-natural',
    name: 'Undertow of F natural',
    category: 'bass',
    description: 'A ringing upright with a dark octave-down reversal of itself pulling underneath.',
    preview: EIGHT_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: -1.5, release: 0.3 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 1200, mix: 0.5 } }],
  },
  {
    id: 'falling-inner-line-wooden-ring-long-door',
    name: 'Wooden ring, long door',
    category: 'bass',
    description:
      'A picked ringing upright whose low bands come back first and high ones last, on a long plate.',
    preview: BASS_JOINS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: -2.5, tone: 0.8, touch: 0.65, release: 0.4 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1500 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-inner-line-sway-that-sets-in-late',
    name: 'Sway that sets in late',
    category: 'bass',
    description:
      'A buzzing fretless that begins straight and sways as it is held, with a hall that answers late.',
    preview: BASS_JOINS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { tone: 0.35, growl: 1, sustain: 15, release: 0.4 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 32, wait: 350, grow: 800 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'falling-inner-line-glints-over-a-pedal',
    name: 'Glints over a pedal',
    category: 'bass',
    description:
      'A bright bridge-plucked bass with slow octaves opening above it, twinkling band by band.',
    preview: PEDAL_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { tone: 1, sustain: 12, release: 0.8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { up2: 0.6 } },
      { deviceId: 'glimmer', preset: 'Wide twinkle' },
    ],
  },
  {
    id: 'falling-inner-line-speaker-in-the-cellar',
    name: 'Speaker in the cellar',
    category: 'bass',
    description: 'A gritty picked bass through a combo at the far end of a corridor.',
    preview: EIGHT_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { tone: 0.8, growl: 0.8, mute: 0.2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 're-amp', preset: 'Down the hall' },
    ],
  },
  {
    id: 'falling-inner-line-violas-go-grey',
    name: 'Violas go grey',
    category: 'string',
    description:
      'Two muted players to a note, their middle band left hanging in a blurred fog, in a hall.',
    preview: EM_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { volume: -5, players: 2, mute: 0.85, bow: 0.2, vibrato: 3 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog', params: { mix: 0.65 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'falling-inner-line-desk-of-inner-parts',
    name: 'Desk of inner parts',
    category: 'string',
    description:
      'Two close players with a warm vibrato inside a wooden soundboard, the middle opened out to the sides.',
    preview: C_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { players: 2, bow: 0.75 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.8 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'falling-inner-line-cold-bow-on-c-sharp',
    name: 'Cold bow on C sharp',
    category: 'string',
    description:
      'Glassy bowing at the bridge, its bands fading in and out like weather, in a thin high space.',
    preview: EM_HELD,
    instrument: { deviceId: 'chamber-strings', preset: 'Glass bridge', params: { attack: 0.5 } },
    effects: [
      { deviceId: 'glimmer', preset: 'Slow weather' },
      { deviceId: 'expanse', preset: 'Thin air' },
    ],
  },
  {
    id: 'falling-inner-line-six-who-will-not-move',
    name: 'Six who will not move',
    category: 'string',
    description:
      'Six slow players with one and two octaves swelling in above them, warmed at the bottom.',
    preview: C_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 1.2, release: 3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral', params: { sub2: 0, sub1: 0, up1: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'falling-inner-line-whispered-major-seventh',
    name: 'Whispered major seventh',
    category: 'string',
    description:
      'Almost all bow air and little string, in a small bright tank that rings, spread by a fed-back detune.',
    preview: DM_HIGH,
    instrument: { deviceId: 'chamber-strings', preset: 'Whisper bows', params: { attack: 0.4 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'falling-inner-line-veil-over-a-flat',
    name: 'Veil over A flat',
    category: 'string',
    description:
      'A thin muted veil with a slow notch moving through it and a light blurred reverb.',
    preview: BB_HIGH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: -4, attack: 0.6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'haze', preset: 'Thin veil' },
    ],
  },
  {
    id: 'falling-inner-line-second-viol-steps-down',
    name: 'Second viol steps down',
    category: 'string',
    description: 'Straight muted viols boxed in dark wood, each note given a gated burst of room.',
    preview: EIGHT,
    instrument: { deviceId: 'chamber-strings', preset: 'Viol consort' },
    effects: [
      { deviceId: 'imprint', preset: 'Dark box' },
      { deviceId: 'shaped-reverb', preset: 'Gated' },
    ],
  },
  {
    id: 'falling-inner-line-ragged-fall-of-four',
    name: 'Ragged fall of four',
    category: 'string',
    description:
      'Six loose players who never quite agree, on tape that drifts as though seasick, their bands breaking in waves.',
    preview: EM_HELD,
    instrument: { deviceId: 'chamber-strings', preset: 'Ragged unison', params: { attack: 0.4 } },
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'currents', preset: 'Breaking waves' },
    ],
  },
  {
    id: 'falling-inner-line-wide-sway-still-root',
    name: 'Wide sway, still root',
    category: 'string',
    description: 'A wide-vibrato trio through a slow rotary cabinet heard from across the room.',
    preview: C_HELD,
    instrument: { deviceId: 'chamber-strings', preset: 'Wide vibrato' },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'falling-inner-line-short-bows-on-the-stair',
    name: 'Short bows on the stair',
    category: 'string',
    description: 'Short biting bows caught by three heads of a tape echo.',
    preview: EIGHT,
    instrument: { deviceId: 'chamber-strings', preset: 'Short bows' },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { time: 600, mix: 0.42 } }],
  },
  {
    id: 'falling-inner-line-sagging-minor-sixth',
    name: 'Sagging minor sixth',
    category: 'string',
    description:
      'Fully muted strings opening and closing like breath, with a tail that sags in pitch as it ages.',
    preview: DM_HIGH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -4.5, attack: 0.9 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath' },
      { deviceId: 'melt', preset: 'Candle wax' },
    ],
  },
  {
    id: 'falling-inner-line-stairwell-half-steps',
    name: 'Stairwell half steps',
    category: 'string',
    description: 'One wandering player to a note, set back in a hard stone stairwell.',
    preview: BB_HIGH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { volume: -4.5, attack: 0.4 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'falling-inner-line-a-then-just-below-a',
    name: 'A, then just below A',
    category: 'keys',
    description:
      'A well felted piano with its own room off, a faint tape repeat and a medium plate.',
    preview: AM_STEP,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.8, reverbMix: 0, outputDb: -16.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'falling-inner-line-f-and-nothing-new',
    name: 'F, and nothing new',
    category: 'keys',
    description:
      'Soft padded hammers with a low string section an octave down growing behind the harmony.',
    preview: F_STEP,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -16.5, reverbMix: 0.1 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Low section' }],
  },
  {
    id: 'falling-inner-line-worn-hammer-on-g-sharp',
    name: 'Worn hammer on G sharp',
    category: 'keys',
    description: 'A worn, gritty piano in mono on a cassette that wobbles and hisses.',
    preview: EIGHT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { outputDb: -18, reverbMix: 0 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette' }],
  },
  {
    id: 'falling-inner-line-upright-with-a-cold-edge',
    name: 'Upright with a cold edge',
    category: 'keys',
    description:
      'A hard bright upright with seven scattered echoes placed across the sides like stars.',
    preview: DM_HIGH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -5, reverbMix: 0.1 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.4 } }],
  },
  {
    id: 'falling-inner-line-half-pedal-half-step',
    name: 'Half pedal, half step',
    category: 'keys',
    description:
      'A half-pedalled piano that sets strings tuned from its own notes ringing, levelled gently.',
    preview: BB_HIGH,
    instrument: { deviceId: 'felt-piano', preset: 'Half pedal', params: { outputDb: -15.5 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'falling-inner-line-creak-before-the-sixth',
    name: 'Creak before the sixth',
    category: 'keys',
    description:
      'A close creaky piano with its strikes turned down and its breath and noise turned up and spread.',
    preview: EIGHT,
    instrument: { deviceId: 'felt-piano', preset: 'Close and creaky', params: { outputDb: -14 } },
    effects: [{ deviceId: 'sift', preset: 'Breath and tone' }],
  },
  {
    id: 'falling-inner-line-hammers-lifted-from-c',
    name: 'Hammers lifted from C',
    category: 'pad',
    description: 'A half-pedalled wash with its attacks faded in, then a slow deep chorus.',
    preview: C_RISE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -6.5, felt: 0.4, hardness: 0.4, sustain: 0.45 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'chorus', preset: 'Deep sea' },
    ],
  },
  {
    id: 'falling-inner-line-plain-strings-one-step',
    name: 'Plain strings, one step',
    category: 'keys',
    description:
      'Plain undetuned strings beside a slightly stretched copy, in a hall with a long airy top.',
    preview: F_RISE,
    instrument: { deviceId: 'felt-piano', preset: 'Still strings' },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'falling-inner-line-loud-hands-low-lid',
    name: 'Loud hands, low lid',
    category: 'keys',
    description:
      'A driven grand closed by a low-pass that opens on each strike, in three long springs.',
    preview: EIGHT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { outputDb: -18, reverbMix: 0.05 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 450, envAmount: 45 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'falling-inner-line-glass-alto-descending',
    name: 'Glass alto descending',
    category: 'bell',
    description:
      'Struck glass tones ringing inside a glass tube, with chorused echoes close behind them.',
    preview: DM_HIGH,
    instrument: { deviceId: 'wavetable', preset: 'Glass bell keys', params: { release: 2 } },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Chorused' },
    ],
  },
  {
    id: 'falling-inner-line-plain-sine-descent',
    name: 'Plain sine descent',
    category: 'pad',
    description: 'A still, sine-like tone pushed into a soft fuzz with an octave glow above it.',
    preview: BB_HIGH,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { attack: 0.2, release: 2 },
    },
    effects: [{ deviceId: 'haze', preset: 'Octave glow' }],
  },
  {
    id: 'falling-inner-line-choir-around-one-mover',
    name: 'Choir around one mover',
    category: 'voice',
    description:
      'A vowel choir in which what the chords share is kept and the rest pulled down, in a vast nave.',
    preview: EM_HELD,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.5, release: 3 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Slow ear' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'falling-inner-line-reeds-drawn-c-to-a',
    name: 'Reeds drawn C to A',
    category: 'organ',
    description: 'A reed organ with full ranks behind shutters that are nearly closed.',
    preview: C_HELD,
    instrument: { deviceId: 'wavetable', preset: 'Reed organ', params: { sub: 0.1 } },
    effects: [{ deviceId: 'stops', preset: 'Shutters closed', params: { sub: 0.4 } }],
  },
  {
    id: 'falling-inner-line-hollow-under-the-sixth',
    name: 'Hollow under the sixth',
    category: 'pad',
    description:
      'A hollow drifting pad, notched deeply by a six-stage phaser fed back upside down.',
    preview: EM_HELD,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.4, release: 3 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Negative notch' }],
  },
  {
    id: 'falling-inner-line-vowels-flicker-on-e',
    name: 'Vowels flicker on E',
    category: 'voice',
    description: 'A vowel pad fluttering seven times a second, with a late oo sung behind it.',
    preview: C_HELD,
    instrument: { deviceId: 'wavetable', preset: 'Vowel flutter', params: { attack: 0.3 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } }],
  },
  {
    id: 'falling-inner-line-saws-thinned-by-halves',
    name: 'Saws thinned by halves',
    category: 'pad',
    description:
      'Thick detuned saws under a steep low-pass that moves extremely slowly, in a small room that answers late.',
    preview: EIGHT,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.04, release: 1 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'falling-inner-line-narrow-reed-wide-rings',
    name: 'Narrow reed, wide rings',
    category: 'plucked',
    description:
      'A narrow pulse with a quick start, its echoes rippling out to both sides in widening rings.',
    preview: C_RISE,
    instrument: { deviceId: 'wavetable', preset: 'Narrow pulse', params: { release: 0.4 } },
    effects: [{ deviceId: 'skipping-stone', preset: 'Wide rings' }],
  },
  {
    id: 'falling-inner-line-struck-a-glows-g-sharp',
    name: 'Struck A, glows G sharp',
    category: 'keys',
    description:
      'Felt strikes whose overtones glow on after them, spread through a close pair of copies.',
    preview: AM_STEP,
    instrument: { deviceId: 'afterglow', preset: 'Felt afterglow', params: { halo: 0, glow: 0.5 } },
    effects: [{ deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.6 } }],
  },
  {
    id: 'falling-inner-line-embers-of-a-seventh',
    name: 'Embers of a seventh',
    category: 'keys',
    description:
      'Dark felt strikes and a low glow through a heavy tape preamp, then long dark springs.',
    preview: F_STEP,
    instrument: { deviceId: 'afterglow', preset: 'Dark felt', params: { volume: -16.5 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'spring-reverb', preset: 'Underwater', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'falling-inner-line-four-bells-lean-inward',
    name: 'Four bells lean inward',
    category: 'bell',
    description:
      'Short bright bells with little glow, shimmering wide, their middle bands echoed ahead of the rest.',
    preview: AM_BELLS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: 6, decay: 1.5, glow: 0.3, halo: 0.1, tone: 0.8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer' },
      { deviceId: 'prism', preset: 'Middle first' },
    ],
  },
  {
    id: 'falling-inner-line-chimes-a-third-down',
    name: 'Chimes, a third down',
    category: 'bell',
    description: 'Bright chimes sampled at a low rate with the images left in, and a clean echo.',
    preview: F_BELLS,
    instrument: { deviceId: 'afterglow', preset: 'Bright chimes', params: { fade: 1.5 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      { deviceId: 'analog-delay', preset: 'Clean echo' },
    ],
  },
  {
    id: 'falling-inner-line-breath-on-the-last-note',
    name: 'Breath on the last note',
    category: 'bell',
    description: 'Breathy glass that swells, each band drifting from side to side like wide water.',
    preview: DM_HIGH,
    instrument: { deviceId: 'afterglow', preset: 'Glass breath', params: { bloom: 1.2 } },
    effects: [{ deviceId: 'currents', preset: 'Wide tide' }],
  },
  {
    id: 'falling-inner-line-low-tide-in-b-flat',
    name: 'Low tide in B flat',
    category: 'bell',
    description:
      'A dark long bell whose glow changes slowly, seen through water with bubbles on its strikes.',
    preview: BB_HIGH,
    instrument: { deviceId: 'afterglow', preset: 'Low tide bell', params: { bloom: 2 } },
    effects: [{ deviceId: 'underwater', preset: 'Under' }],
  },
  {
    id: 'falling-inner-line-no-strike-only-a-turn',
    name: 'No strike, only a turn',
    category: 'pad',
    description: 'The glow with no strike, moving through a slow twelve-stage phaser cloud.',
    preview: EM_HELD,
    instrument: { deviceId: 'afterglow', preset: 'Only the glow', params: { bloom: 0.7 } },
    effects: [{ deviceId: 'phaser', preset: 'Twelve stage cloud' }],
  },
  {
    id: 'falling-inner-line-plucked-steps-long-haze',
    name: 'Plucked steps, long haze',
    category: 'plucked',
    description: 'Plucks whose glow comes up fast, hung in a blurred, fuzzed wall of reverb.',
    preview: C_HELD,
    instrument: { deviceId: 'afterglow', preset: 'Pluck and haze' },
    effects: [{ deviceId: 'haze', preset: 'Slow bloom', params: { mix: 0.5 } }],
  },
  {
    id: 'falling-inner-line-evening-turns-on-d-sharp',
    name: 'Evening turns on D sharp',
    category: 'pad',
    description:
      'Chorused saw strings with the filter low and ringing a little, hollowed by an inverted flange.',
    preview: EM_HELD,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { wave: 0, cutoff: 900, resonance: 0.5, envelope: 0.1, attack: 0.3, sub: 0.1 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Negative hollow' }],
  },
  {
    id: 'falling-inner-line-reed-inside-the-chord',
    name: 'Reed inside the chord',
    category: 'wind',
    description:
      'A dark square reed with the chorus off, its vibrato setting in late, in a small chapel.',
    preview: C_HELD,
    instrument: { deviceId: 'dusk', preset: 'Soft clarinets', params: { attack: 0.2, chorus: 0 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'vowel-reverb', preset: 'Chapel' },
    ],
  },
  {
    id: 'falling-inner-line-organ-with-one-finger',
    name: 'Organ with one finger',
    category: 'organ',
    description: 'A square organ in both choruses, through a fast bright rotary horn.',
    preview: EIGHT,
    instrument: { deviceId: 'dusk', preset: 'Shimmer organ', params: { sub: 0.25 } },
    effects: [{ deviceId: 'rotary', preset: 'Bright horn' }],
  },
  {
    id: 'falling-inner-line-opens-as-the-line-falls',
    name: 'Opens as the line falls',
    category: 'pad',
    description: 'A saw and square pad whose filter opens slowly, levelled into an even wall.',
    preview: EM_HELD,
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { attack: 1.2, release: 4, sub: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'falling-inner-line-a-filter-singing-on-c',
    name: 'A filter singing on C',
    category: 'pad',
    description:
      'A saw through a filter that rings on one high C, coming and going from a distance on a long plate.',
    preview: C_HELD,
    instrument: { deviceId: 'dusk', preset: 'Singing filter', params: { attack: 0.4 } },
    effects: [
      { deviceId: 'distance', preset: 'Breathing' },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'falling-inner-line-warm-hands-on-the-stair',
    name: 'Warm hands on the stair',
    category: 'keys',
    description: 'Short warm synth keys with a half-second dark echo that drifts slowly in pitch.',
    preview: AM_STEP,
    instrument: { deviceId: 'dusk', preset: 'Warm keys' },
    effects: [{ deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 500 } }],
  },
  {
    id: 'falling-inner-line-cellar-copy-of-a-chord',
    name: 'Cellar copy of a chord',
    category: 'pad',
    description:
      'A nearly closed pad with its sub octave full, its low band pulsing slowly, in a dark cave.',
    preview: DM_HIGH,
    instrument: { deviceId: 'dusk', preset: 'Octave below', params: { attack: 0.4 } },
    effects: [
      { deviceId: 'band-pulse', preset: 'Slow low pulse' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave' },
    ],
  },
  {
    id: 'falling-inner-line-bright-edge-dark-middle',
    name: 'Bright edge, dark middle',
    category: 'string',
    description:
      'Thin resonant strings with ripples rising through their bands, the outer ends wide and the middle narrow.',
    preview: BB_HIGH,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.4, brilliance: 2600, lowCut: 600, resonance: 0.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple' },
      { deviceId: 'spread', preset: 'Wide ends' },
    ],
  },
  {
    id: 'falling-inner-line-brass-leans-off-a-root',
    name: 'Brass leans off a root',
    category: 'pad',
    description:
      'Slow swelling brass through a tape preamp, with a hall that blooms after each chord.',
    preview: EM_HELD,
    instrument: { deviceId: 'aurora', preset: 'Slow brass' },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'falling-inner-line-horns-keeping-the-fifth',
    name: 'Horns keeping the fifth',
    category: 'wind',
    description: 'Soft horns inside a large stopped pipe that rings like a cistern.',
    preview: C_HELD,
    instrument: { deviceId: 'aurora', preset: 'Soft horns', params: { attack: 0.5 } },
    effects: [{ deviceId: 'vessel', preset: 'Cistern' }],
  },
  {
    id: 'falling-inner-line-ring-on-the-raised-note',
    name: 'Ring on the raised note',
    category: 'bell',
    description:
      'Ring-modulated strikes that go on sounding as metal, followed by thin tape repeats.',
    preview: C_RISE,
    instrument: { deviceId: 'aurora', preset: 'Metal dawn', params: { attack: 0.01, release: 2 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Thin and fading' }],
  },
  {
    id: 'falling-inner-line-mute-over-four-halves',
    name: 'Mute over four halves',
    category: 'wind',
    description: 'A thin muted trumpet on a far shortwave band, with noise around it.',
    preview: F_RISE,
    instrument: { deviceId: 'aurora', preset: 'Muted trumpet', params: { attack: 0.05 } },
    effects: [{ deviceId: 'patina', preset: 'Shortwave' }],
  },
  {
    id: 'falling-inner-line-mouth-opening-on-e',
    name: 'Mouth opening on E',
    category: 'voice',
    description:
      'A resonant filter vowel opening on each chord, with rising fifths blooming in its tail.',
    preview: EM_HELD,
    instrument: { deviceId: 'aurora', preset: 'Opening vowel', params: { attack: 0.8 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths' }],
  },
]
