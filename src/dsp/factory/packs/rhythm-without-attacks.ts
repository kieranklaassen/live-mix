import { type FactoryPreset, type Phrase } from '../types'

// Nothing is struck. Two steady tones a chosen number of hertz apart beat, and the beating is the
// pulse: in most of the phrases every pitch is such a pair, the pitches stand in pure ratios, and
// the rates are 1:2:3, 3:4, 5:7, 2:3:5, 4:5:7 or 7:8:9. Laid out by where the beat comes from: the phrase
// alone, the instrument's own pair or gate against it, or a chain that moves every key by the same
// hertz, which holds a rate on any key.

// A minor with its ninth: A2 E3 A3 C4 E4 B4 (110 165 220 264 330 495 Hz), the second tones
// 0.5, 1, 1.5, 2, 2.5 and 3 Hz above: beats of 1 2 3 4 5 6 in two seconds.
const FOOT_TAP: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 45.0785, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 52.0196, gain: 0.45 },
    { atSec: 0, durSec: 6.4, note: 52.1242, gain: 0.45 },
    { atSec: 0, durSec: 6.4, note: 57, gain: 0.42 },
    { atSec: 0, durSec: 6.4, note: 57.1176, gain: 0.42 },
    { atSec: 0, durSec: 6.4, note: 60.1564, gain: 0.4 },
    { atSec: 0, durSec: 6.4, note: 60.2871, gain: 0.4 },
    { atSec: 0, durSec: 6.4, note: 64.0196, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 64.1502, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 71.0391, gain: 0.28 },
    { atSec: 0, durSec: 6.4, note: 71.1437, gain: 0.28 },
  ],
}

// Three against four: A3 at 220 and 223, then C4 at 264 and 267, under an E4 at 330 and 334
// that is held through. Their crests meet once a second.
const THREE_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 64.0196, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 64.2281, gain: 0.5 },
    { atSec: 0, durSec: 3, note: 57, gain: 0.55 },
    { atSec: 0, durSec: 3, note: 57.2345, gain: 0.55 },
    { atSec: 3, durSec: 3.4, note: 60.1564, gain: 0.55 },
    { atSec: 3, durSec: 3.4, note: 60.352, gain: 0.55 },
  ],
}

// Seven, eight and nine: D3, A3 and D4 (147, 220.5, 294 Hz) with 7, 8 and 9 beats in four
// seconds, so 1.75, 2 and 2.25 Hz. They meet at the start and again at four seconds.
const SEVENS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 50.0198, gain: 0.6 },
    { atSec: 0, durSec: 6.5, note: 50.2246, gain: 0.6 },
    { atSec: 0, durSec: 6.5, note: 57.0393, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 57.1956, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 62.0198, gain: 0.45 },
    { atSec: 0, durSec: 6.5, note: 62.1517, gain: 0.45 },
  ],
}

// Slowing by addition: B4 at 4 Hz, G4 at 3, E4 at 2 and C4 at 1 come in a second
// apart, down a C major seventh, and all of them stay. Each enters where the faster ones
// crest, on an instrument that starts its tones together.
const SLOWING: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 71.0391, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 71.1784, gain: 0.4 },
    { atSec: 1, durSec: 6, note: 67.176, gain: 0.45 },
    { atSec: 1, durSec: 6, note: 67.3066, gain: 0.45 },
    { atSec: 2, durSec: 5, note: 64.0196, gain: 0.5 },
    { atSec: 2, durSec: 5, note: 64.1242, gain: 0.5 },
    { atSec: 3, durSec: 4, note: 60.1564, gain: 0.55 },
    { atSec: 3, durSec: 4, note: 60.2219, gain: 0.55 },
  ],
}

// The other way: C4 at 1 Hz, G4 at 2, D5 at 3 and E5 at 4, upwards, C major with its ninth.
const QUICKENING: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 60.1564, gain: 0.55 },
    { atSec: 0, durSec: 7, note: 60.2219, gain: 0.55 },
    { atSec: 1, durSec: 6, note: 67.176, gain: 0.5 },
    { atSec: 1, durSec: 6, note: 67.2632, gain: 0.5 },
    { atSec: 2, durSec: 5, note: 74.1955, gain: 0.4 },
    { atSec: 2, durSec: 5, note: 74.2827, gain: 0.4 },
    { atSec: 3, durSec: 4, note: 76.0196, gain: 0.38 },
    { atSec: 3, durSec: 4, note: 76.1242, gain: 0.38 },
  ],
}

// Five and seven in four seconds: C3 at 1.25 Hz and G3 at 1.75 Hz, with E4 at 0.25 Hz over them:
// the only bar line is the crest that all three share every four seconds.
const BAR_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 48.1564, gain: 0.6 },
    { atSec: 0, durSec: 6.8, note: 48.3196, gain: 0.6 },
    { atSec: 0, durSec: 6.8, note: 55.176, gain: 0.52 },
    { atSec: 0, durSec: 6.8, note: 55.3283, gain: 0.52 },
    { atSec: 0, durSec: 6.8, note: 64.0196, gain: 0.36 },
    { atSec: 0, durSec: 6.8, note: 64.0327, gain: 0.36 },
  ],
}

// F major seventh, F3 A3 C4 E4 (176 220 264 330 Hz), beating 2, 1, 3 and 5 a second: two, three and
// five over the A that counts the seconds.
const TWO_THREE_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 53.1369, gain: 0.55 },
    { atSec: 0, durSec: 6.5, note: 53.3325, gain: 0.55 },
    { atSec: 0, durSec: 6.5, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 57.0785, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 60.1564, gain: 0.46 },
    { atSec: 0, durSec: 6.5, note: 60.352, gain: 0.46 },
    { atSec: 0, durSec: 6.5, note: 64.0196, gain: 0.4 },
    { atSec: 0, durSec: 6.5, note: 64.2799, gain: 0.4 },
  ],
}

// Four, five and seven in two seconds on an open G major: G3 D4 B4 (198 297 495 Hz) at 2, 2.5 and 3.5 Hz.
const WIDE_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 55.176, gain: 0.6 },
    { atSec: 0, durSec: 6.5, note: 55.35, gain: 0.6 },
    { atSec: 0, durSec: 6.5, note: 62.1955, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 62.3406, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 71.0391, gain: 0.4 },
    { atSec: 0, durSec: 6.5, note: 71.1611, gain: 0.4 },
  ],
}

// Three chords at one pulse: A minor, F over A, C over G (A3 C4 E4, A3 C4 F4, G3 C4 E4). The C is held
// through and the others move by step, the voices always beating 1, 2 and 3 a second from the bottom up.
const CHANGES: Phrase = {
  notes: [
    { atSec: 0, durSec: 4, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 4, note: 57.0785, gain: 0.5 },
    { atSec: 0, durSec: 6.6, note: 60.1564, gain: 0.46 },
    { atSec: 0, durSec: 6.6, note: 60.2871, gain: 0.46 },
    { atSec: 0, durSec: 2, note: 64.0196, gain: 0.42 },
    { atSec: 0, durSec: 2, note: 64.1762, gain: 0.42 },
    { atSec: 2, durSec: 2, note: 65.1369, gain: 0.42 },
    { atSec: 2, durSec: 2, note: 65.2838, gain: 0.42 },
    { atSec: 4, durSec: 2.6, note: 55.176, gain: 0.5 },
    { atSec: 4, durSec: 2.6, note: 55.2632, gain: 0.5 },
    { atSec: 4, durSec: 2.6, note: 64.0196, gain: 0.42 },
    { atSec: 4, durSec: 2.6, note: 64.1762, gain: 0.42 },
  ],
}

// A bass with no pairs in it, for the patches that make their own: A1 and F1 for two seconds each, then C2
// and E1 for about a second and a half.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 33, gain: 0.7 },
    { atSec: 2, durSec: 2, note: 29.1369, gain: 0.7 },
    { atSec: 4, durSec: 1.5, note: 36.1564, gain: 0.65 },
    { atSec: 5.5, durSec: 1.7, note: 28.0196, gain: 0.7 },
  ],
}

// Two breaths for two players a part: A4 and C5, then out to G4 and E5 in contrary motion, the lower part
// 4 Hz apart and the upper 6, so two beats run against three.
const TWO_BREATHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 69, gain: 0.55 },
    { atSec: 0, durSec: 3.1, note: 69.1567, gain: 0.55 },
    { atSec: 0, durSec: 3.1, note: 72.1564, gain: 0.5 },
    { atSec: 0, durSec: 3.1, note: 72.352, gain: 0.5 },
    { atSec: 3.6, durSec: 3.1, note: 67.176, gain: 0.55 },
    { atSec: 3.6, durSec: 3.1, note: 67.35, gain: 0.55 },
    { atSec: 3.6, durSec: 3.1, note: 76.0196, gain: 0.5 },
    { atSec: 3.6, durSec: 3.1, note: 76.1762, gain: 0.5 },
  ],
}

// One pair 2 Hz apart on F3, then on C3: whatever the patch builds on the root in a ratio beats in that ratio.
const ONE_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 53.1369, gain: 0.6 },
    { atSec: 0, durSec: 3.2, note: 53.3325, gain: 0.6 },
    { atSec: 3.2, durSec: 3.5, note: 48.1564, gain: 0.6 },
    { atSec: 3.2, durSec: 3.5, note: 48.4168, gain: 0.6 },
  ],
}

// The same on roots whose minor chord is in the key: a pair 2 Hz apart on A3, then on E3.
const MINOR_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.3, note: 57, gain: 0.6 },
    { atSec: 0, durSec: 3.3, note: 57.1567, gain: 0.6 },
    { atSec: 3.3, durSec: 3.5, note: 52.0196, gain: 0.6 },
    { atSec: 3.3, durSec: 3.5, note: 52.2281, gain: 0.6 },
  ],
}

// A bass that stays long enough for a slow rate to be counted: D2 for four seconds, then a fifth down to G1.
const LONG_FLOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 4, note: 38.1955, gain: 0.7 },
    { atSec: 4, durSec: 3.2, note: 31.176, gain: 0.7 },
  ],
}

// A2 E3 C4 B4 in pure ratios with nothing doubled, so that the only beats are the ones the patch makes.
const STEADY: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 45, gain: 0.6 },
    { atSec: 0, durSec: 6.4, note: 52.0196, gain: 0.55 },
    { atSec: 0, durSec: 6.4, note: 60.1564, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 71.0391, gain: 0.36 },
  ],
}

// Nothing doubled, up where a flute can play it: C4 G4 B4 E5, then C4 A4 C5 E5 (C major seventh to A minor
// over C). C and E stay and the two inside go up a step.
const STEP_INSIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 60.1564, gain: 0.5 },
    { atSec: 0, durSec: 6.6, note: 76.0196, gain: 0.38 },
    { atSec: 0, durSec: 3.3, note: 67.176, gain: 0.45 },
    { atSec: 0, durSec: 3.3, note: 71.0391, gain: 0.42 },
    { atSec: 3.3, durSec: 3.3, note: 69, gain: 0.45 },
    { atSec: 3.3, durSec: 3.3, note: 72.1564, gain: 0.42 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Isochronic: its own soft gate is one rate, the pairs or the chain are the other.
  {
    id: 'rhythm-without-attacks-four-gates-on-three',
    name: 'Four gates on three',
    category: 'pad',
    description:
      'Near-sine keys gated softly four times a second and each doubled three hertz higher, so four runs over three.',
    preview: STEADY,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Four soft',
      params: { depth: 0.5, edge: 50, warmth: 0.08, attack: 1.2, release: 2.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 3, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-lamp-on-the-quay',
    name: 'Lamp on the quay',
    category: 'pad',
    description:
      'A warm tone let partly down once in two seconds, the edges of the gate spread by a long fog and a dark hall.',
    preview: TWO_THREE_FIVE,
    instrument: {
      deviceId: 'isochronic',
      preset: 'One in two seconds',
      params: { duty: 0.6, depth: 0.5, warmth: 0.75, attack: 2, release: 6 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise', params: { size: 500, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-air-in-the-pairs',
    name: 'Air in the pairs',
    category: 'texture',
    description:
      'Only noise, a band at each key, breathing three times in two seconds and held to the notes of C major.',
    preview: TWO_THREE_FIVE,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Noise at ten',
      params: {
        volume: -0.5,
        rate: 1.5,
        duty: 0.5,
        edge: 50,
        depth: 0.75,
        air: 1,
        attack: 1,
        release: 3,
      },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'In a major key',
        params: { root: 0, scale: 0, ring: 0.8, depth: 30, mix: 0.8 },
      },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'rhythm-without-attacks-weight-to-weight',
    name: 'Weight to weight',
    category: 'pad',
    description:
      'Two gates a second, the right ear half a turn behind the left, on warm keys that beat once in two seconds.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Left then right',
      params: {
        volume: -2,
        rate: 2,
        depth: 0.6,
        edge: 50,
        duty: 0.5,
        warmth: 0.7,
        attack: 0.8,
        release: 2,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.5, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-five-in-the-cellar',
    name: 'Five in the cellar',
    category: 'drone',
    description:
      'A gate of five and a copy that beats seven in two seconds, full of partials but shut under a low-pass at 420 Hz.',
    preview: STEADY,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Warm for low keys',
      params: { rate: 2.5, depth: 0.7, edge: 45, duty: 0.5, warmth: 1, attack: 0.5, release: 1 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 3.5, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 420, resonance: 0.8 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-losing-steam',
    name: 'Losing steam',
    category: 'pad',
    description:
      'The gate slows from four a second to one over nine seconds under held pairs, through a wide slow chorus.',
    preview: SLOWING,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Eleven to two',
      params: {
        rate: 4,
        target: 1,
        glide: 0.15,
        depth: 0.65,
        edge: 50,
        air: 0.1,
        warmth: 0.3,
        attack: 0.5,
        release: 3,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'rhythm-without-attacks-gathering-way',
    name: 'Gathering way',
    category: 'pad',
    description:
      'Half air and half tone, its gate quickening from one a second to five over seven seconds, swaying from side to side.',
    preview: QUICKENING,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Eight to sixteen',
      params: {
        rate: 1,
        target: 5,
        glide: 0.12,
        depth: 0.7,
        edge: 50,
        air: 0.5,
        warmth: 0,
        offset: 0,
        attack: 1,
        release: 2,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.5, depth: 0.6 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
    ],
  },
  {
    id: 'rhythm-without-attacks-fourteen-like-cloth',
    name: 'Fourteen like cloth',
    category: 'texture',
    description:
      'A fourteen a second ripple too fine to count, over a copy one hertz up whose slow beat carries the count.',
    preview: STEADY,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Fourteen a second',
      params: { depth: 0.45, edge: 20, warmth: 0.2, air: 0.15, attack: 1.5, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1, feedback: 0, lfoDepth: 0, width: 1, mix: 0.5 },
      },
      { deviceId: 'currents', preset: 'Gentle drift' },
    ],
  },
  {
    id: 'rhythm-without-attacks-blinds-half-drawn',
    name: 'Blinds half drawn',
    category: 'pad',
    description:
      'Three shallow gates a second on pure sines, with slowing layers of pulse laid over them in the same soft edge.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Three a second',
      params: { depth: 0.35, duty: 0.7, edge: 50, warmth: 0, attack: 2.5, release: 4 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Three slowing', params: { edge: 50, depth: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'rhythm-without-attacks-ferry-idling',
    name: 'Ferry idling',
    category: 'drone',
    description:
      'Warm keys with a sub octave added, shuddering gently five times a second as if heard from under the hull.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Warm for low keys',
      params: { volume: -10, rate: 5, depth: 0.35, edge: 50, warmth: 0.8, attack: 0.9, release: 2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.8, up1: 0 } },
      { deviceId: 'underwater', preset: 'Under', params: { depth: 0.4, bubbles: 0 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-bar-line-in-vowels',
    name: 'Bar line in vowels',
    category: 'voice',
    description:
      'A gate of five in four seconds through a ring at 0.875 Hz that turns over seven times, in a reverb shaped by a vowel.',
    preview: STEADY,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Slow swell',
      params: {
        rate: 1.25,
        duty: 0.55,
        depth: 0.6,
        warmth: 0.5,
        air: 0.1,
        attack: 0.8,
        release: 3,
      },
    },
    effects: [
      {
        deviceId: 'ring',
        params: { tune: 1, frequency: 0.875, drift: 0, lowCut: 20, width: 0, mix: 1 },
      },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-quarter-turn-late',
    name: 'Quarter turn late',
    category: 'pad',
    description:
      'One broad gate a second, the right ear a quarter turn behind, answered by tape repeats at two thirds of a second.',
    preview: THREE_FOUR,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Two a second',
      params: {
        rate: 1,
        offset: 90,
        depth: 0.9,
        edge: 50,
        duty: 0.45,
        warmth: 0.25,
        attack: 0.6,
        release: 1.2,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 667, feedback: 0.45, highCut: 2600, mix: 0.4 },
      },
    ],
  },
  {
    id: 'rhythm-without-attacks-two-lanes-of-wind',
    name: 'Two lanes of wind',
    category: 'wind',
    description:
      'Mostly noise at the key, two a second and ear against ear, blown through a ringing open pipe.',
    preview: WIDE_SEVEN,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Five and air',
      params: {
        volume: -2.5,
        rate: 2,
        duty: 0.5,
        depth: 0.55,
        air: 0.75,
        offset: 180,
        edge: 50,
        attack: 0.7,
        release: 1.8,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { material: 0.7, air: 0.1, mix: 0.55 },
      },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'rhythm-without-attacks-lit-from-above',
    name: 'Lit from above',
    category: 'pad',
    description:
      'Pure keys swelling four times in five seconds, their strongest partials shadowed by sines an octave up.',
    preview: QUICKENING,
    instrument: {
      deviceId: 'isochronic',
      preset: 'Slow swell',
      params: { rate: 0.8, depth: 0.8, warmth: 0.1, duty: 0.6, attack: 0.3, release: 5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { transpose: 12, mix: 0.55 } },
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.4 } },
    ],
  },

  // Binaural: each key is already a pair. Ears at zero puts its beat in the air; a second rate comes from the notes or the chain.
  {
    id: 'rhythm-without-attacks-two-in-air-three-on',
    name: 'Two in air, three on',
    category: 'pad',
    description:
      'Every key beats twice a second in the air and its copy three hertz up adds three: two against three on any key.',
    preview: STEADY,
    instrument: {
      deviceId: 'binaural',
      preset: 'Two a second',
      params: { beat: 2, ears: 0, warmth: 0.1, attack: 1, release: 2 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 3, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-only-between-ears',
    name: 'Only between ears',
    category: 'drone',
    description:
      'A bare sine to each ear, one hertz apart, rising over three seconds, with a thin open space and a gentle top cut.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'binaural',
      preset: 'Slow turn',
      params: { beat: 1, ears: 1, warmth: 0, attack: 3, release: 6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 5000 } },
      { deviceId: 'expanse', preset: 'Thin air' },
    ],
  },
  {
    id: 'rhythm-without-attacks-crossed-threes',
    name: 'Crossed threes',
    category: 'pad',
    description:
      'Four tones a key, crossed between the ears, so each side beats three a second; a twelve-stage phaser moves over them.',
    preview: TWO_THREE_FIVE,
    instrument: {
      deviceId: 'binaural',
      preset: 'Slow cross',
      params: { volume: 6, beat: 3, layout: 1, ears: 0.6, warmth: 0.8, attack: 0.8, release: 2.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'rhythm-without-attacks-tide-table',
    name: 'Tide table',
    category: 'texture',
    description:
      'A brown noise bed under pure pairs that beat three times in two seconds, the whole of it washed by slow surf.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'binaural',
      preset: 'Brown bed, slow',
      params: { beat: 1.5, ears: 0, bed: 0.45, colour: 0.95, warmth: 0, attack: 2, release: 4 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.25, exposure: 0.5 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'rhythm-without-attacks-pink-in-two-bands',
    name: 'Pink in two bands',
    category: 'texture',
    description:
      'Pairs beating three a second on a pink bed, while only the band from 250 Hz to 1.2 kHz swells twice a second.',
    preview: STEADY,
    instrument: {
      deviceId: 'binaural',
      preset: 'Pink bed, six',
      params: {
        volume: 4.5,
        beat: 3,
        ears: 0,
        bed: 0.4,
        colour: 0.5,
        warmth: 0.5,
        attack: 1.2,
        release: 3,
      },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        preset: 'Slow low pulse',
        params: { rate: 2, depth: 0.7, duty: 0.5, edge: 50, low: 250, high: 1200, offset: 0 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'rhythm-without-attacks-coming-to-rest',
    name: 'Coming to rest',
    category: 'pad',
    description:
      'Every pair starts five hertz wide and closes to half a hertz in eight seconds, the beat in the air slowing with it.',
    preview: STEADY,
    instrument: {
      deviceId: 'binaural',
      preset: 'Ten down to six',
      params: {
        beat: 5,
        target: 0.5,
        glide: 0.13,
        ears: 0,
        bed: 0,
        warmth: 0.35,
        attack: 0.4,
        release: 4,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width' },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-pulling-apart',
    name: 'Pulling apart',
    category: 'pad',
    description:
      'Warm pairs that open from half a hertz to six in seven seconds, with an octave climbing in the tail.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'binaural',
      preset: 'Rising to three',
      params: {
        beat: 0.5,
        target: 6,
        glide: 0.12,
        ears: 0.3,
        bed: 0.1,
        colour: 0.2,
        warmth: 0.9,
        attack: 1.5,
        release: 3,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.05, wow: 0.1 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3, decay: 5 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-reed-rank-in-fives',
    name: 'Reed rank in fives',
    category: 'organ',
    description:
      'Full warmth and five beats in two seconds, driven through a triode and a slow rotary cabinet.',
    preview: THREE_FOUR,
    instrument: {
      deviceId: 'binaural',
      preset: 'Detuned rank',
      params: { beat: 2.5, ears: 0, warmth: 1, attack: 0.25, release: 0.6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.35 } },
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1, mix: 0.7 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-glass-four-a-second',
    name: 'Glass four a second',
    category: 'pad',
    description:
      'Bare pairs four hertz wide with louder copies one octave up and softer ones two, on a bright plate.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'binaural',
      preset: 'Four in the air',
      params: { volume: 5, beat: 4, ears: 0, warmth: 0, attack: 0.6, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Glass octaves',
        params: { sub1: 0, dry: 0.5, up1: 0.7, up2: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-one-beat-in-two',
    name: 'One beat in two',
    category: 'drone',
    description:
      'A pair that crests once in two seconds with dark stops an octave below and a fifth above that are slow to speak.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'binaural',
      preset: 'Near unison',
      params: { beat: 0.5, ears: 0, warmth: 0.3, attack: 1, release: 7 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Pedal under',
        params: {
          sub: 0.8,
          fifth: 0.4,
          octave: 0.1,
          twelfth: 0,
          fifteenth: 0,
          tone: 0.2,
          chiff: 0,
          speak: 600,
        },
      },
      { deviceId: 'fog', preset: 'Morning mist' },
    ],
  },
  {
    id: 'rhythm-without-attacks-five-quarters-sung',
    name: 'Five quarters, sung',
    category: 'voice',
    description:
      'Pairs beating five times in four seconds, pressed into a round vowel and left in a small dark room.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'binaural',
      preset: 'Three a second',
      params: { beat: 1.25, ears: 0.2, warmth: 1, attack: 1, release: 2 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'rhythm-without-attacks-sevens-in-the-fives',
    name: 'Sevens in the fives',
    category: 'pad',
    description:
      'A pair that crests seven times in four seconds and, below two kilohertz, a shift in the air that crests five.',
    preview: STEADY,
    instrument: {
      deviceId: 'binaural',
      preset: 'Bars seven apart',
      params: { volume: 4.5, beat: 1.75, ears: 0, warmth: 0.6, attack: 0.5, release: 1.2 },
    },
    effects: [
      {
        deviceId: 'ear-shift',
        preset: 'Two, mostly air',
        params: { beat: 1.25, ears: 0, low: 60, high: 2000 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'rhythm-without-attacks-eight-under-snow',
    name: 'Eight under snow',
    category: 'texture',
    description:
      'Pairs eight hertz wide, rough rather than counted, on a white bed, rocked by one slow tremolo a second.',
    preview: MINOR_PAIR,
    instrument: {
      deviceId: 'binaural',
      preset: 'White bed, ten',
      params: { beat: 8, ears: 0, bed: 0.35, colour: 0.1, warmth: 0.6, attack: 1.5, release: 4 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Sea swell',
        params: { mode: 0, rate: 1, depth: 0.5, shape: 0, drift: 0 },
      },
      { deviceId: 'seasons', preset: 'Deep winter', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-half-in-one-ear',
    name: 'Half in one ear',
    category: 'pad',
    description:
      'Pairs two and a quarter hertz wide, half shared by the ears, circling the head slowly at a little distance.',
    preview: SEVENS,
    instrument: {
      deviceId: 'binaural',
      preset: 'Rough sixteen',
      params: { volume: 6, beat: 2.25, ears: 0.5, warmth: 0.45, attack: 0.9, release: 1.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.125 } },
      { deviceId: 'distance', preset: 'A few steps back', params: { wander: 0 } },
    ],
  },

  // Still Point: steady keys and one sine that sweeps through them, so a beat slows, stops and speeds away over the written ones.
  {
    id: 'rhythm-without-attacks-four-seconds-across',
    name: 'Four seconds across',
    category: 'pad',
    description:
      'Pure keys with a full-level sine crossing them every four seconds, half a semitone beyond each end, in a hall.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'still-point',
      preset: 'Pure crossing',
      params: { volume: -11, time: 4, reach: 0.5, level: 1, warmth: 0, attack: 0.6, release: 2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'rhythm-without-attacks-standing-a-moment',
    name: 'Standing a moment',
    category: 'pad',
    description:
      'Every key and the sweeping sine are copied one hertz up, so a count of one a second stands under the moving beats.',
    preview: THREE_FOUR,
    instrument: {
      deviceId: 'still-point',
      preset: 'Deep slow beat',
      params: { time: 8, reach: 0.3, level: 0.6, warmth: 0.3, attack: 1.5, release: 3 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'stereo-detune', preset: 'Top only' },
    ],
  },
  {
    id: 'rhythm-without-attacks-left-keeps-still',
    name: 'Left keeps still',
    category: 'drone',
    description:
      'The keys stay in the left ear and the sweeping sine in the right, thickened by tape and muffled above.',
    preview: MINOR_PAIR,
    instrument: {
      deviceId: 'still-point',
      preset: 'Sine in one ear',
      params: {
        volume: -10,
        time: 6,
        reach: 1,
        level: 0.9,
        ears: 1,
        warmth: 0.5,
        attack: 1,
        release: 2.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'rhythm-without-attacks-a-third-each-way',
    name: 'A third each way',
    category: 'keys',
    description:
      'The sine swings a major third beyond the chord in ten seconds, quick to speak, with clean steady tape repeats.',
    preview: SEVENS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Third each side',
      params: { volume: -10, level: 0.4, warmth: 0.1, attack: 0.2, release: 1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 1000, feedback: 0.5, mix: 0.35 },
      },
    ],
  },
  {
    id: 'rhythm-without-attacks-siren-behind-hills',
    name: 'Siren behind hills',
    category: 'texture',
    description:
      'A sine an octave past the keys at both ends, low in level, part of its sweep smeared into a hanging mist.',
    preview: THREE_FOUR,
    instrument: {
      deviceId: 'still-point',
      preset: 'Octave reach',
      params: { time: 14, level: 0.35, warmth: 0.6, attack: 2, release: 5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.3 } },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'rhythm-without-attacks-warm-in-sixes',
    name: 'Warm in sixes',
    category: 'organ',
    description:
      'Keys at full warmth, a faint sine moving through them, shaken by an even tremolo three times in two seconds.',
    preview: TWO_THREE_FIVE,
    instrument: {
      deviceId: 'still-point',
      preset: 'Warm crossing',
      params: { time: 10, reach: 0.8, level: 0.25, warmth: 1, attack: 0.4, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { mode: 0, rate: 1.5, depth: 0.5, shape: 0, drift: 0 },
      },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },
  {
    id: 'rhythm-without-attacks-bowl-rim-crossing',
    name: 'Bowl rim crossing',
    category: 'bell',
    description:
      'A sine as loud as the keys passes in seven seconds and sets a table of slow-beating metal bowls in C ringing.',
    preview: QUICKENING,
    instrument: {
      deviceId: 'still-point',
      preset: 'Even match',
      params: { time: 7, reach: 0.6, warmth: 0.15, attack: 0.8, release: 4 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Bowl table',
        params: { root: 0, scale: 2, strike: 0, beat: 0.5, mix: 0.5 },
      },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'rhythm-without-attacks-blown-across-a-neck',
    name: 'Blown across a neck',
    category: 'wind',
    description:
      'Half-split tones held inside a blown bottle, the sine crossing every five seconds at a low level.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Half split',
      params: { time: 5, reach: 0.4, level: 0.35, warmth: 0.4, attack: 0.5, release: 1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'rhythm-without-attacks-a-tenth-from-unison',
    name: 'A tenth from unison',
    category: 'pad',
    description:
      'Pure keys with a sine never more than a tenth of a semitone past them, ringing a glassy set of strings in C major.',
    preview: SLOWING,
    instrument: {
      deviceId: 'still-point',
      preset: 'Near unison',
      params: { time: 10, reach: 0.1, level: 0.8, attack: 0.8, release: 3 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { root: 0, mode: 0, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'rhythm-without-attacks-whistle-over-the-d',
    name: 'Whistle over the D',
    category: 'voice',
    description:
      'Warm steady keys from which a narrow resonance picks harmonics of D one a second, with a sine passing beneath.',
    preview: SEVENS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Full and split',
      params: { time: 12, reach: 1, level: 0.3, ears: 0.4, warmth: 1, attack: 0.8, release: 2 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Overtone melody',
        params: { root: 2, pace: 1, mix: 0.8 },
      },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-fuzz-under-the-beat',
    name: 'Fuzz under the beat',
    category: 'drone',
    description:
      'Two-thirds level sine and warm keys pushed into a blurred fuzz, so each crest brings up its own overtones.',
    preview: MINOR_PAIR,
    instrument: {
      deviceId: 'still-point',
      preset: 'Half minute pass',
      params: { time: 9, reach: 0.25, level: 0.66, warmth: 0.7, attack: 1, release: 2 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Small room fuzz', params: { mix: 0.45 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'rhythm-without-attacks-sweep-a-fifth-wide',
    name: 'Sweep a fifth wide',
    category: 'pad',
    description:
      'A sine reaching a fifth past the keys, one ear leaning to it, climbing again in a tail that never arrives.',
    preview: WIDE_SEVEN,
    instrument: {
      deviceId: 'still-point',
      preset: 'Fifth reach',
      params: { time: 11, level: 0.5, warmth: 0.35, attack: 1.2, release: 3 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.35, decay: 5 } }],
  },
  {
    id: 'rhythm-without-attacks-on-the-dial-at-night',
    name: 'On the dial at night',
    category: 'texture',
    description:
      'The crossing sine heard as a whistle on a drifting short-wave link, thin and fading, under held pairs.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'still-point',
      preset: 'Quick sweep',
      params: { time: 5, reach: 2, level: 0.5, warmth: 0.8, attack: 0.6, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { static: 0.15, fading: 0.4, interference: 0.05 },
      },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },

  // Drone: what a key builds above its root in a ratio beats in that ratio, so one pair is already a polyrhythm.
  {
    id: 'rhythm-without-attacks-two-roots-three-fifths',
    name: 'Two roots, three fifths',
    category: 'drone',
    description:
      'Motionless stacked fifths: a pair on one root beats two there and three at the fifth. A little air, a short room.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        shape: 2,
        partials: 0.5,
        wave: 0,
        movement: 0,
        sub: 0,
        air: 0.08,
        cutoff: 3000,
        attack: 1,
        release: 2,
        width: 0.1,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'rhythm-without-attacks-four-five-six-triad',
    name: 'Four, five, six triad',
    category: 'pad',
    description:
      'A just major shape held perfectly still, so a pair beats four, five and six on its triad; bright, centred, on a plate.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: {
        movement: 0,
        sub: 0,
        air: 0.05,
        wave: 0,
        cutoff: 7000,
        attack: 1.5,
        release: 3,
        width: 0.15,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'rhythm-without-attacks-ladder-of-beats',
    name: 'Ladder of beats',
    category: 'drone',
    description:
      'A still harmonic series and its sub under a ring at one hertz: every harmonic swells twice a second at once, on any key.',
    preview: STEADY,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: {
        movement: 0,
        partials: 0.7,
        sub: 0.5,
        air: 0,
        attack: 1.5,
        release: 3,
        width: 0.9,
        cutoff: 3000,
      },
    },
    effects: [
      {
        deviceId: 'ring',
        params: { tune: 1, frequency: 1, drift: 0, lowCut: 20, width: 0, mix: 1 },
      },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'rhythm-without-attacks-peat-and-the-count',
    name: 'Peat and the count',
    category: 'drone',
    description:
      'Octaves and a little sub under a 260 Hz filter, pressed lightly through a transformer; only the pairs move.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        volume: -14.5,
        movement: 0,
        partials: 0.2,
        wave: 0.4,
        sub: 0.35,
        cutoff: 260,
        attack: 2,
        release: 4,
        width: 0.1,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.2 } },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'rhythm-without-attacks-dusk-swelling-on-a-third',
    name: 'Dusk swelling on a third',
    category: 'pad',
    description:
      'A still just minor shape: a pair beats ten, twelve and fifteen times in five seconds on its chord, in a low dark space.',
    preview: MINOR_PAIR,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: {
        movement: 0,
        wave: 0.3,
        sub: 0.3,
        air: 0.1,
        cutoff: 1300,
        width: 0.15,
        attack: 2,
        release: 5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.2, decay: 7 } }],
  },
  {
    id: 'rhythm-without-attacks-second-counts-the-fifth',
    name: 'Second counts the fifth',
    category: 'drone',
    description:
      'A root with its second and fifth, nearly still and centred: a pair on it beats eight, nine and twelve times over.',
    preview: SEVENS,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: {
        partials: 0.29,
        wave: 0,
        movement: 0.03,
        rate: 0.5,
        width: 0.1,
        sub: 0.2,
        air: 0,
        cutoff: 2200,
        attack: 1,
        release: 3,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'rhythm-without-attacks-pulse-in-the-hiss',
    name: 'Pulse in the hiss',
    category: 'texture',
    description:
      'Tuned air alone on each key, opened once in two seconds by a low-pass and beaten three a second in its middle band.',
    preview: STEADY,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { movement: 0.1, attack: 1, release: 3, width: 0.8 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Tremolo filter',
        params: { type: 0, slope: 1, cutoffHz: 700, lfoRateHz: 0.5, lfoAmount: 70, lfoShape: 0 },
      },
      { deviceId: 'ear-shift', preset: 'Three, mid band', params: { beat: 3, ears: 0 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-sawn-in-threes',
    name: 'Sawn in threes',
    category: 'string',
    description:
      'A unison of saws that hardly moves, darkened to a bowed tone, with a copy three hertz up, a light chorus and a hall.',
    preview: STEADY,
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: {
        volume: -5.5,
        movement: 0.12,
        rate: 0.2,
        partials: 0.3,
        cutoff: 1800,
        attack: 0.9,
        release: 1.8,
        width: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 3, feedback: 0, lfoDepth: 0, width: 0, mix: 0.45 },
      },
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-octaves-doubling-time',
    name: 'Octaves doubling time',
    category: 'pad',
    description:
      'Octave copies of each root, still and bright: the beat of a pair is doubled in each octave above it.',
    preview: SLOWING,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: {
        movement: 0,
        partials: 0.45,
        width: 0.15,
        sub: 0,
        air: 0.1,
        wave: 0.15,
        cutoff: 9000,
        attack: 0.7,
        release: 3,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'rhythm-without-attacks-string-in-a-gourd',
    name: 'String in a gourd',
    category: 'string',
    description:
      'A full buzzing harmonic series held still, heard inside a wooden body beside tuned strings in C major.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { movement: 0, width: 0.1, wave: 0.9, attack: 0.5, release: 2.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.6 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 0, mode: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-hum-in-an-empty-hall',
    name: 'Hum in an empty hall',
    category: 'drone',
    description:
      'A sine hum and its sub, filter at 240 Hz, beating at half and one hertz through two chained shifts over faint room noise.',
    preview: STEADY,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { movement: 0, attack: 2, release: 5, partials: 0.1, sub: 0.7, cutoff: 240 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.5, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      {
        deviceId: 'freq-shifter',
        params: { fine: 1, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -56 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-glass-thirds-in-step',
    name: 'Glass thirds in step',
    category: 'pad',
    description:
      'Still minor partials, all sines and open to the top, each band given its own small tremolo moving outward.',
    preview: MINOR_PAIR,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: {
        movement: 0,
        width: 0.2,
        air: 0,
        partials: 0.9,
        attack: 0.8,
        release: 4,
        cutoff: 12000,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rings outward', params: { rate: 1 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-standing-in-the-pipe',
    name: 'Standing in the pipe',
    category: 'organ',
    description:
      'A still, centred harmonic series with about half its partials in, flute stops speaking late around it, in a cathedral.',
    preview: CHANGES,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { attack: 0.4, release: 0.9, wave: 0.2, cutoff: 1600, sub: 0.2 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Flute stops',
        params: { speak: 300, twelfth: 0.5, fifteenth: 0.3, mix: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },

  // Sub bass: one voice with no pair of its own, so the chain makes one, by hertz and the same on every key.
  {
    id: 'rhythm-without-attacks-cellar-keeps-count',
    name: 'Cellar keeps count',
    category: 'bass',
    description:
      'A pure sine that fades in over a third of a second, doubled two hertz higher: two beats a second on any key.',
    preview: LONG_FLOOR,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pure sine',
      params: { volume: -29, attack: 0.35, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 2, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'rhythm-without-attacks-two-and-three-below',
    name: 'Two and three below',
    category: 'bass',
    description:
      'One low hum sent through two shifts, two hertz and then three, with odd harmonics that small speakers find.',
    preview: GROUND,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Small speaker hum',
      params: { volume: -20.5, attack: 0.25, release: 1, drive: 0.2, harmonics: 0.6 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 2, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      {
        deviceId: 'freq-shifter',
        params: { fine: 3, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
    ],
  },
  {
    id: 'rhythm-without-attacks-tide-in-the-piles',
    name: 'Tide in the piles',
    category: 'bass',
    description:
      'A slow swell sliding between overlapping keys, its one hertz beat a quarter turn apart on the two sides, over a dark plate.',
    preview: LONG_FLOOR,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Slow swell',
      params: { volume: -21, attack: 1, release: 3, glide: 0.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1, feedback: 0, lfoDepth: 0, width: 1, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-hollow-wood-in-five',
    name: 'Hollow wood in five',
    category: 'bass',
    description:
      'A hollow square softened at the front, five swells in two seconds from a free ring, inside a drum body.',
    preview: GROUND,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Hollow square',
      params: { volume: -15, attack: 0.2, release: 0.5, drive: 0.3 },
    },
    effects: [
      {
        deviceId: 'ring',
        params: { tune: 1, frequency: 1.25, drift: 0, lowCut: 20, width: 0, mix: 1 },
      },
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-boat-engine-far-off',
    name: 'Boat engine far off',
    category: 'bass',
    description:
      'A driven pulse with its knock taken off, held, beating four and six a second, and set at the back of a hall.',
    preview: GROUND,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Driven pulse',
      params: { volume: -18.5, attack: 0.3, decay: 20, drop: 0, release: 0.6, drive: 0.7 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 4, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      {
        deviceId: 'freq-shifter',
        params: { fine: 6, feedback: 0, lfoDepth: 0, width: 0, mix: 0.4 },
      },
      { deviceId: 'distance', preset: 'Back of the hall', params: { wander: 0 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-pedal-pipe-in-halves',
    name: 'Pedal pipe in halves',
    category: 'organ',
    description:
      'A pedal tone rich in second and third harmonic, beating half a hertz, with a chorus of principal stops above it.',
    preview: LONG_FLOOR,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pedal tone',
      params: { volume: -22.5, attack: 0.15, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.5, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'stops', preset: 'Principal chorus', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-sighed-into-place',
    name: 'Sighed into place',
    category: 'bass',
    description:
      'A slow front that falls an octave onto its note and stays, its tremolo swelling three times in two seconds, in a small dark room.',
    preview: LONG_FLOOR,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Falling sigh',
      params: { volume: -19, attack: 0.4, decay: 20, harmonics: 0.3, release: 2 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Sea swell',
        params: { mode: 0, rate: 1.5, depth: 0.7, shape: 0, phase: 0, smooth: 0.2, drift: 0 },
      },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'rhythm-without-attacks-floor-slows-down',
    name: 'Floor slows down',
    category: 'bass',
    description:
      'A dark held drone under layers of pulse that always seem to slow, soft edged, with two wide echoes behind it.',
    preview: LONG_FLOOR,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dark drone',
      params: { volume: -15, attack: 0.6, harmonics: 0.4, release: 4, glide: 1 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Ever slower', params: { edge: 50, depth: 0.7 } },
      { deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-drum-under-the-swell',
    name: 'Drum under the swell',
    category: 'bass',
    description:
      'A squared low tone rising for most of a second, swelling three times in two seconds and spun on the dark drum of a rotary.',
    preview: LONG_FLOOR,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Gliding sub',
      params: { volume: -20.5, attack: 0.9, harmonics: 0.3, shape: 0.9, release: 2.5 },
    },
    effects: [
      {
        deviceId: 'ring',
        params: { tune: 1, frequency: 0.75, drift: 0, lowCut: 20, width: 0, mix: 1 },
      },
      { deviceId: 'rotary', preset: 'Dark drum', params: { mix: 1 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-soft-pulses-crossing',
    name: 'Soft pulses crossing',
    category: 'bass',
    description:
      'A soft pulse let in slowly, swelled by three pulses in every five, the right side two steps off the left, with a faint octave above.',
    preview: GROUND,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Soft pulse',
      params: { volume: -19, attack: 0.25, decay: 20, harmonics: 0.5, release: 1.2 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Soft throb',
        params: { rate: 3, steps: 5, fill: 3, shift: 2, drift: 0, apart: 1, edge: 1, floor: 0.3 },
      },
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.2, sub1: 0 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-dub-with-no-drummer',
    name: 'Dub with no drummer',
    category: 'bass',
    description:
      'A weighty driven sub with a soft front, a copy three hertz up, and dark repeats three quarters of a second apart.',
    preview: GROUND,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dub weight',
      params: { volume: -20, drop: 0, attack: 0.2, decay: 20, release: 0.4, drive: 0.6 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 3, feedback: 0, lfoDepth: 0, width: 0.4, mix: 0.5 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 750, feedback: 0.4, modDepth: 0.1, mix: 0.35 },
      },
    ],
  },
  {
    id: 'rhythm-without-attacks-seven-quarters-deep',
    name: 'Seven quarters deep',
    category: 'bass',
    description:
      'A sub with its harmonics full up and a copy 1.75 Hz over it, so seven beats in four seconds, on a narrow warm spring.',
    preview: LONG_FLOOR,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Soft sub',
      params: { volume: -19, drop: 0, attack: 0.5, harmonics: 1, shape: 0.5, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1.75, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },

  // Ember: two oscillators a few cents or a few hertz apart, two slow movements set in a ratio.
  {
    id: 'rhythm-without-attacks-foot-under-the-table',
    name: 'Foot under the table',
    category: 'pad',
    description:
      'A single sine oscillator a key with a one second front, nothing moving in it, in a hall: what beats is what is played.',
    preview: FOOT_TAP,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        volume: -17,
        osc1Shape: 3,
        cutoff: 8000,
        ampAttack: 1,
        ampRelease: 2,
        velToAmp: 0.4,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } }],
  },
  {
    id: 'rhythm-without-attacks-level-two-filter-three',
    name: 'Level two, filter three',
    category: 'pad',
    description:
      'A warm saw pad with nothing detuned, its level moving two a second and its filter three, both on sines, on a small plate.',
    preview: STEADY,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        osc2Fine: 0,
        unisonVoices: 1,
        cutoff: 900,
        lfo1Shape: 0,
        lfo1Rate: 2,
        lfo1Dest: 2,
        lfo1Amount: 0.6,
        lfo2Shape: 0,
        lfo2Rate: 3,
        lfo2Dest: 1,
        lfo2Amount: 0.35,
        ampAttack: 0.8,
        ampRelease: 2.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'rhythm-without-attacks-triangles-at-three',
    name: 'Triangles at three',
    category: 'keys',
    description:
      'Plain triangles at two octaves with a copy three hertz above, so the low and the high throb at one rate, close and dry.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: {
        volume: -5,
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Fine: 0,
        oscMix: 0.35,
        cutoff: 3500,
        filterEnvAmount: 0,
        lfo1Amount: 0,
        lfo2Amount: 0,
        unisonVoices: 1,
        ampAttack: 0.25,
        ampRelease: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 3, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'spread', preset: 'Soft tilt' },
    ],
  },
  {
    id: 'rhythm-without-attacks-fifth-in-every-key',
    name: 'Fifth in every key',
    category: 'drone',
    description:
      'Each key carries its own fifth on a second triangle, so a pair beats two below and three above; a dark slow filter.',
    preview: MINOR_PAIR,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Coarse: 7,
        osc2Fine: 2,
        oscMix: 0.5,
        subLevel: 0,
        noiseLevel: 0,
        cutoff: 900,
        resonance: 0.1,
        lfo1Amount: 0.1,
        lfo2Amount: 0,
        unisonVoices: 1,
        ampAttack: 1,
        ampRelease: 3,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-strings-with-no-bar',
    name: 'Strings with no bar',
    category: 'string',
    description:
      'Saws in unison with no detune, a slow front, and a copy two and a half hertz up that beats across a cathedral.',
    preview: STEADY,
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        volume: -9.5,
        unisonVoices: 1,
        osc2Fine: 0,
        cutoff: 1400,
        lfo2Amount: 0,
        ampAttack: 1.2,
        ampRelease: 2.5,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 2.5, feedback: 0, lfoDepth: 0, width: 0.3, mix: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.2, decay: 7 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-widths-in-fours',
    name: 'Widths in fours',
    category: 'pad',
    description:
      'Two pulse waves whose widths turn once a second while they pan three times in four, through a faint phaser.',
    preview: THREE_FOUR,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: {
        osc1Shape: 1,
        osc1Pw: 0.4,
        osc2Shape: 1,
        osc2Coarse: 12,
        osc2Fine: 0,
        oscMix: 0.3,
        cutoff: 1800,
        resonance: 0.1,
        unisonVoices: 1,
        lfo1Shape: 0,
        lfo1Rate: 1,
        lfo1Dest: 4,
        lfo1Amount: 0.6,
        lfo2Shape: 0,
        lfo2Rate: 0.75,
        lfo2Dest: 3,
        lfo2Amount: 0.6,
        ampAttack: 0.5,
        ampRelease: 1.5,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'rhythm-without-attacks-band-of-wind-in-five',
    name: 'Band of wind in five',
    category: 'texture',
    description:
      'Filtered noise with a sine beneath it, the band opening five times in two seconds, spread by a bloom of scattered tails.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        noiseLevel: 0.5,
        filterType: 2,
        cutoff: 700,
        resonance: 0.3,
        keyTrack: 0.5,
        filterEnvAmount: 0,
        lfo1Shape: 0,
        lfo1Rate: 2.5,
        lfo1Dest: 1,
        lfo1Amount: 0.3,
        ampAttack: 1.2,
        ampRelease: 2,
      },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Scatter', params: { mix: 0.3, decay: 4 } }],
  },
  {
    id: 'rhythm-without-attacks-brass-that-only-leans',
    name: 'Brass that only leans',
    category: 'wind',
    description:
      'A brassy pair of saws with its bite filed off, beating by eight cents, its middle band swelling twice a second.',
    preview: CHANGES,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        cutoff: 600,
        filterEnvAmount: 0.2,
        filterAttack: 0.6,
        filterDecay: 1,
        filterSustain: 0.8,
        filterRelease: 0.8,
        ampAttack: 0.35,
        ampRelease: 0.9,
        filterDrive: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        preset: 'Four a second',
        params: { rate: 2, depth: 0.55, edge: 50, duty: 0.5, low: 120, high: 2500 },
      },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-no-hammer-bells',
    name: 'No hammer bells',
    category: 'bell',
    description:
      'A sine and its twelfth, faded in where the strike was and held, half of it through a warp that respaces its partials.',
    preview: QUICKENING,
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: {
        ampAttack: 0.6,
        ampDecay: 6,
        ampSustain: 0.5,
        ampRelease: 2.5,
        velToAmp: 0.5,
        oscMix: 0.3,
      },
    },
    effects: [
      { deviceId: 'warp', preset: 'Thin glow', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-sync-in-slow-seven',
    name: 'Sync in slow seven',
    category: 'texture',
    description:
      'A hard-synced saw pushed far down behind a filter that lifts seven times in four seconds, worn by an old cassette.',
    preview: SEVENS,
    instrument: {
      deviceId: 'ember',
      preset: 'Sync Lead',
      params: {
        voiceMode: 0,
        glide: 0,
        osc2Coarse: 12,
        cutoff: 700,
        filterEnvAmount: 0,
        filterDrive: 0.1,
        lfo1Shape: 0,
        lfo1Rate: 1.75,
        lfo1Dest: 1,
        lfo1Amount: 0.3,
        ampAttack: 0.8,
        ampRelease: 1.2,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } },
      { deviceId: 'fog', preset: 'Morning mist' },
    ],
  },
  {
    id: 'rhythm-without-attacks-sum-and-difference',
    name: 'Sum and difference',
    category: 'bass',
    description:
      'A sine with its sub, one note at a time with a slow front, doubled a hertz and a half up, then pressed through a tube curve.',
    preview: GROUND,
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: { volume: -10.5, ampAttack: 0.4, ampRelease: 0.8, subLevel: 0.6 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1.5, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 10 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-airy-crests',
    name: 'Airy crests',
    category: 'pad',
    description:
      'An airy saw and its octave, thinned below 500 Hz, swelling seven times in two seconds under a ring, in a whispered hall.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        volume: 0.5,
        unisonVoices: 1,
        osc2Fine: 0,
        noiseLevel: 0.08,
        filterType: 1,
        cutoff: 500,
        lfo1Amount: 0,
        lfo2Amount: 0,
        ampAttack: 1,
        ampRelease: 3,
      },
    },
    effects: [
      {
        deviceId: 'ring',
        params: { tune: 1, frequency: 1.75, drift: 0, lowCut: 20, width: 0, mix: 1 },
      },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.35 } },
    ],
  },

  // Organ: pipes drawn still, the bellows almost shut, so the pairs are even; the celeste is a second beat of its own.
  {
    id: 'rhythm-without-attacks-flutes-for-two-clerks',
    name: 'Flutes for two clerks',
    category: 'organ',
    description:
      'Flute pipes alone with the wind held still, speaking softly, so that written pairs beat evenly; a chapel room after.',
    preview: THREE_FOUR,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: {
        sub: 0,
        octave: 0,
        fifteenth: 0,
        breath: 0.05,
        bellows: 0,
        attack: 0.3,
        tone: 6000,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'rhythm-without-attacks-celeste-is-the-clock',
    name: 'Celeste is the clock',
    category: 'organ',
    description:
      'Only the beating celeste and its eight foot, shifted another hertz, so each key has its rank beat and one to count by.',
    preview: STEADY,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { breath: 0, bellows: 0, attack: 1, release: 3, tone: 1800 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1, feedback: 0, lfoDepth: 0, width: 0, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-six-pulses-full-organ',
    name: 'Six pulses, full organ',
    category: 'organ',
    description:
      'Light ranks from sub to fifteenth rising over half a second with no celeste, the bass firm and the top wide, in a bright hall.',
    preview: FOOT_TAP,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        volume: -19.5,
        sub: 0.15,
        octave: 0.2,
        twelfth: 0.1,
        fifteenth: 0.15,
        reed: 0.1,
        celeste: 0,
        bellows: 0,
        breath: 0,
        attack: 0.6,
        release: 1.2,
        tone: 4500,
      },
    },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-pump-turned-to-two',
    name: 'Pump turned to two',
    category: 'organ',
    description:
      'A reedy pump organ with no bellows motion, its middle band swelling twice a second instead, in a wooden box.',
    preview: CHANGES,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { bellows: 0, celeste: 0, breath: 0.2, attack: 0.25 },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        preset: 'Three a second',
        params: { rate: 2, depth: 0.6, duty: 0.5, edge: 50 },
      },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-three-beats-to-one',
    name: 'Three beats to one',
    category: 'organ',
    description:
      'A hollow twelfth over a soft eight foot, so each pair beats once below and three times above; a little of a tight spring.',
    preview: TWO_THREE_FIVE,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { volume: -15.5, bellows: 0, breath: 0.1, attack: 0.5, release: 1 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.2 } }],
  },
  {
    id: 'rhythm-without-attacks-pedal-you-can-count',
    name: 'Pedal you can count',
    category: 'bass',
    description:
      'A sixteen foot pedal under 500 Hz with its wind held still, beating three in two seconds by a shift, close and dark.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { volume: -20, celeste: 0, bellows: 0, attack: 0.4, release: 1, tone: 500 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1.5, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-voices-behind-a-grille',
    name: 'Voices behind a grille',
    category: 'voice',
    description:
      'A straight reed rank with the tremulant off, thinned below 160 Hz, its tail sung on an oo.',
    preview: WIDE_SEVEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0, bellows: 0, attack: 0.5, tone: 1000 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 160, type: 1 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-squeezebox-on-the-slip',
    name: 'Squeezebox on the slip',
    category: 'organ',
    description:
      'Bright free reeds with their own wide celeste, taking turns side to side once a second in an outdoor wind.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { bellows: 0.2, attack: 0.3, release: 0.4, tone: 4500 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { mode: 1, rate: 1, depth: 0.5 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.15, exposure: 0.35 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-next-room-in-sevens',
    name: 'Next room, in sevens',
    category: 'drone',
    description:
      'All ranks heard through a wall under 380 Hz, beating seven in four seconds below 400 Hz, next door.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { celeste: 0, bellows: 0, attack: 0.8 },
    },
    effects: [
      { deviceId: 'ear-shift', preset: 'Two, low band', params: { beat: 1.75, ears: 0 } },
      { deviceId: 'distance', preset: 'Next door' },
    ],
  },
  {
    id: 'rhythm-without-attacks-one-breath-of-wind',
    name: 'One breath of wind',
    category: 'wind',
    description:
      'Wind noise over a plain pipe, opened and shut by a breath that comes round every four seconds, in an open valley.',
    preview: BAR_LINE,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { bellows: 0, attack: 1.2, release: 1.5, tone: 2000 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 1.5, hold: 0.3, out: 1.8, rest: 0.4, depth: 0.6, vary: 0 },
      },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-bloom-on-the-bar',
    name: 'Bloom on the bar',
    category: 'organ',
    description:
      'Upper ranks opening over two seconds and fading for five, with fifths that fall away in the tail.',
    preview: QUICKENING,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: {
        volume: -14.5,
        celeste: 0,
        bellows: 0,
        attack: 2,
        release: 5,
        tone: 7000,
        sub: 0,
        octave: 0.3,
        twelfth: 0.25,
        fifteenth: 0.35,
        reed: 0.1,
      },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.22, decay: 4 } },
    ],
  },

  // Flute: players with the vibrato taken out; the breath's own drift leans on the beats and does not cover them.
  {
    id: 'rhythm-without-attacks-two-players-a-part',
    name: 'Two players a part',
    category: 'wind',
    description:
      'A concert flute with no vibrato and almost no breath, barely blown, rising for most of a second into a reverb that blooms.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        breath: 0.03,
        blow: 0.1,
        chiff: 0,
        vibrato: 0,
        scoop: 0,
        attack: 0.8,
        release: 1.2,
      },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'rhythm-without-attacks-low-flutes-lean',
    name: 'Low flutes lean',
    category: 'wind',
    description:
      'A low flute, airy and slow to speak, each note with a copy four hertz up that travels between the sides.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { vibrato: 0, chiff: 0, scoop: 0, breath: 0.35, attack: 0.9, release: 2 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 4, feedback: 0, lfoDepth: 0, width: 1, mix: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-recorders-at-the-rail',
    name: 'Recorders at the rail',
    category: 'wind',
    description:
      'Soft wooden pipes, nearly pure, let in gently and held by a slow compressor, with three tape heads answering half a second on.',
    preview: QUICKENING,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { volume: -15, chiff: 0, attack: 0.4, release: 0.9, scoop: 0 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 500, feedback: 0.3, mix: 0.25 },
      },
    ],
  },
  {
    id: 'rhythm-without-attacks-pipes-in-clay-cups',
    name: 'Pipes in clay cups',
    category: 'wind',
    description:
      'Pan pipes with the puff taken off, blown into a clay pot and made to swell three times a second by a ring at 1.5 Hz.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { vibrato: 0, chiff: 0, breath: 0.35, attack: 0.7, release: 1.8 },
    },
    effects: [
      {
        deviceId: 'ring',
        params: { tune: 1, frequency: 1.5, drift: 0, lowCut: 20, width: 0, mix: 1 },
      },
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-breath-in-the-pair',
    name: 'Breath in the pair',
    category: 'texture',
    description:
      'Almost all breath in a low pipe, with a grain cloud smearing it slowly and a pair of tones showing through.',
    preview: SLOWING,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { vibrato: 0, breath: 0.8, blow: 0.2, attack: 1.2, release: 2 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'rhythm-without-attacks-bamboo-at-a-crawl',
    name: 'Bamboo at a crawl',
    category: 'wind',
    description:
      'A bamboo flute whose vibrato is replaced by one that waits a second, then widens to two sways a second.',
    preview: STEP_INSIDE,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: {
        volume: -16,
        vibrato: 0,
        chiff: 0,
        scoop: 10,
        breath: 0.45,
        attack: 0.5,
        release: 1.5,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Slow bow',
        params: { wait: 1000, grow: 1500, rate: 2, depth: 20, human: 0, quicken: 0 },
      },
      { deviceId: 'spiral', preset: 'Held still', params: { mix: 0.25, decay: 4 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-flock-above-the-weir',
    name: 'Flock above the weir',
    category: 'wind',
    description:
      'A wood flute that takes a second to swell, flown as eight players round the head whose small bends all beat.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { volume: -14, attack: 0.8, release: 2.5, breath: 0.3, vibrato: 0 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'rhythm-without-attacks-octave-flutes-rocking',
    name: 'Octave flutes rocking',
    category: 'wind',
    description:
      'Hard-blown flutes eased in, with an octave above, a tremolo of five in two seconds and a top rolled off.',
    preview: QUICKENING,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { vibrato: 0, chiff: 0, blow: 0.8, attack: 0.25, release: 0.5, scoop: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { dry: 0.7, up1: 0.5, up2: 0 } },
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { mode: 0, rate: 2.5, depth: 0.45, shape: 0, drift: 0 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 4000 } },
    ],
  },

  // Rewind: notes that only arrive, with no snap at the end of the swell.
  {
    id: 'rhythm-without-attacks-bowls-that-hover',
    name: 'Bowls that hover',
    category: 'bell',
    description:
      'Paired bowl modes that climb and hover while a key is held, with no snap as they land and a copy one hertz up.',
    preview: ONE_PAIR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Held bowl',
      params: { volume: -3, swell: 0.8, rise: 0, snap: 0, ghost: 0.2, wobble: 0, shimmer: 0.3 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1, feedback: 0, lfoDepth: 0, width: 0, mix: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, decay: 6 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-bells-let-down-softly',
    name: 'Bells let down softly',
    category: 'bell',
    description:
      'Bell partials that grow while a key is down and ring when it is let go, two copies beating, the attacks fogged over.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { volume: 4.5, swell: 1, rise: 0.1, snap: 0, wobble: 0, tail: 0.5, tone: 0.4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rhythm-without-attacks-keys-turned-inside-out',
    name: 'Keys turned inside out',
    category: 'keys',
    description:
      'Piano partials swelling for over a second with no snap and no tape wobble, then ringing beside a wide shimmer copy.',
    preview: MINOR_PAIR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Slow bloom',
      params: {
        swell: 1.3,
        rise: 0,
        snap: 0,
        wobble: 0,
        shimmer: 0.9,
        width: 1,
        ghost: 0.1,
        tail: 1,
      },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails' },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
]
