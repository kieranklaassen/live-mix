import { type FactoryPreset, type Phrase } from '../types'

// Three Pedals: pedal steel in which each pedal is a voice. A chord is picked once and then only
// bent: the first pedal takes the fifth up a tone, the second the third up a semitone, a knee lever
// moves the root a semitone. Laid out by how the pedal is pressed (glide), what rings on meanwhile
// (swell and sustain) and how bright the string is. Guitar and bow play the same changes with the
// moving voice struck or bowed again and the others held.

// A steel bends a held string to a note that starts beside it, so each pedal below is an overlap.

// C E G, both pedals (C F A), second off (C E A), first off (C E G): I, IV, vi, I.
const ROCKED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 3.4, note: 69, gain: 0.5 },
    { atSec: 1.5, durSec: 1.8, note: 65, gain: 0.5 },
  ],
}

// A C E G rings for over three seconds before the first pedal takes the seventh up to the root: Am7, Am.
const LATE_FOOT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 67, gain: 0.5 },
    { atSec: 3.6, durSec: 2.8, note: 69, gain: 0.5 },
  ],
}

// Lever down (B E G) and back, then the second pedal alone (C F G) and back: I, iii, I, Isus4, I.
const KNEE_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 67, gain: 0.5 },
    { atSec: 1.4, durSec: 1.5, note: 59, gain: 0.5 },
    { atSec: 3.4, durSec: 1.6, note: 65, gain: 0.5 },
  ],
}

// Lever up with the first pedal (C sharp E A), then both pedals (C F A): C sharp falls as E rises. Ends C E A.
const KNEE_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 67, gain: 0.5 },
    { atSec: 1.4, durSec: 1.7, note: 61, gain: 0.5 },
    { atSec: 1.4, durSec: 4.9, note: 69, gain: 0.5 },
    { atSec: 3.1, durSec: 1.7, note: 65, gain: 0.5 },
  ],
}

// On E G B the first pedal goes half way: a semitone, E G C. Then E down a tone, D G B: i, VI, i, III, i.
const HALF_PRESS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 71, gain: 0.5 },
    { atSec: 1.4, durSec: 1.5, note: 72, gain: 0.5 },
    { atSec: 3.4, durSec: 1.6, note: 62, gain: 0.5 },
  ],
}

// The first pedal pressed in thirds of its travel, so G is nearly three seconds on its way to A: C, then A minor.
const CREEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 6.6, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 6.6, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 5.1, note: 67.65, gain: 0.5 },
    { atSec: 2.4, durSec: 4.2, note: 68.3, gain: 0.5 },
    { atSec: 3.3, durSec: 3.3, note: 69, gain: 0.5 },
  ],
}

// A low open grip, C G E: first pedal (C A E), second on top of it (C A F), and off in the other order.
const TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 64, gain: 0.5 },
    { atSec: 1.5, durSec: 3.7, note: 57, gain: 0.5 },
    { atSec: 2.7, durSec: 1.4, note: 65, gain: 0.5 },
  ],
}

// A high grip, G C E: lever down (G B E), first pedal (A C E), both (A C F), home: I, iii, I, vi, IV, I.
const HIGH_SIXTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 67, gain: 0.45 },
    { atSec: 0, durSec: 6.4, note: 72, gain: 0.45 },
    { atSec: 0, durSec: 6.4, note: 76, gain: 0.45 },
    { atSec: 1.3, durSec: 1.4, note: 71, gain: 0.45 },
    { atSec: 3.1, durSec: 2.2, note: 69, gain: 0.45 },
    { atSec: 4.2, durSec: 1.1, note: 77, gain: 0.45 },
  ],
}

// D A F in dorian: root down (C A F), home, third up (D A G), fifth up too (D B G), home: i, III, i, isus4, IV, i.
const DORIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 65, gain: 0.5 },
    { atSec: 1.3, durSec: 1.4, note: 48, gain: 0.5 },
    { atSec: 3.1, durSec: 2.2, note: 67, gain: 0.5 },
    { atSec: 4, durSec: 1.3, note: 59, gain: 0.5 },
  ],
}

// One string over the fifth A E, picked once: E F G F E D E, every step a pedal or a lever.
const ONE_STRING: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 45, gain: 0.4 },
    { atSec: 0, durSec: 6.4, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 6.4, note: 64, gain: 0.6 },
    { atSec: 0.9, durSec: 3.1, note: 65, gain: 0.6 },
    { atSec: 1.8, durSec: 1.2, note: 67, gain: 0.6 },
    { atSec: 4.6, durSec: 0.9, note: 62, gain: 0.6 },
  ],
}

// Both pedals down, then the first let up half way: C F A, C F A flat, C E G: IV, minor iv, I.
const HALF_LIFT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 6.3, note: 67, gain: 0.5 },
    { atSec: 1.3, durSec: 3.6, note: 69, gain: 0.5 },
    { atSec: 1.3, durSec: 3.6, note: 65, gain: 0.5 },
    { atSec: 3, durSec: 1.9, note: 68, gain: 0.5 },
  ],
}

// For instruments that cannot bend. C held throughout, G to A, E to F, both home, over C A F C: I, vi, IV, I.
const GRIP: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 3, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 1.5, note: 45, gain: 0.5 },
    { atSec: 1.5, durSec: 3, note: 69, gain: 0.5 },
    { atSec: 3, durSec: 1.5, note: 41, gain: 0.5 },
    { atSec: 3, durSec: 1.5, note: 65, gain: 0.5 },
    { atSec: 4.5, durSec: 2, note: 48, gain: 0.5 },
    { atSec: 4.5, durSec: 2, note: 64, gain: 0.5 },
    { atSec: 4.5, durSec: 2, note: 67, gain: 0.5 },
  ],
}

// The grip picked string by string, and then only the string that moves: C, Am over C, F, C.
const PICKED: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 48, gain: 0.6 },
    { atSec: 0.4, durSec: 6, note: 60, gain: 0.5 },
    { atSec: 0.8, durSec: 2.4, note: 64, gain: 0.5 },
    { atSec: 1.2, durSec: 1, note: 67, gain: 0.5 },
    { atSec: 2.2, durSec: 2.8, note: 69, gain: 0.6 },
    { atSec: 3.2, durSec: 1.6, note: 41, gain: 0.6 },
    { atSec: 3.2, durSec: 1.6, note: 65, gain: 0.5 },
    { atSec: 4.8, durSec: 1.6, note: 48, gain: 0.6 },
    { atSec: 4.8, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 5, durSec: 1.4, note: 67, gain: 0.5 },
  ],
}

// Two late pedals for slow bows over A and C held: the G on top handed to A, then E to F: Am7, Am, F over A.
const HANDED_OVER: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 6.9, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 4.6, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 2.5, note: 67, gain: 0.5 },
    { atSec: 2.5, durSec: 4.4, note: 69, gain: 0.5 },
    { atSec: 4.6, durSec: 2.3, note: 65, gain: 0.5 },
  ],
}

// For strings that die early, three picks at three frets and each one bent: C E G to C F A and back,
// G B D to G C E and back, C E G to B E G and back: I IV I, V I V, I iii I.
const QUICK_FOOT: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 2.1, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 2.1, note: 67, gain: 0.55 },
    { atSec: 0.5, durSec: 0.8, note: 69, gain: 0.55 },
    { atSec: 0.5, durSec: 0.8, note: 65, gain: 0.55 },
    { atSec: 2.2, durSec: 2.1, note: 55, gain: 0.55 },
    { atSec: 2.2, durSec: 2.1, note: 59, gain: 0.55 },
    { atSec: 2.2, durSec: 2.1, note: 62, gain: 0.55 },
    { atSec: 2.7, durSec: 0.8, note: 64, gain: 0.55 },
    { atSec: 2.7, durSec: 0.8, note: 60, gain: 0.55 },
    { atSec: 4.4, durSec: 2.2, note: 60, gain: 0.55 },
    { atSec: 4.4, durSec: 2.2, note: 64, gain: 0.55 },
    { atSec: 4.4, durSec: 2.2, note: 67, gain: 0.55 },
    { atSec: 4.9, durSec: 0.8, note: 59, gain: 0.55 },
  ],
}

// The roots under eight pedal changes, one at a time: C A F G, E A F C.
const ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 48, gain: 0.6 },
    { atSec: 0.85, durSec: 0.8, note: 45, gain: 0.6 },
    { atSec: 1.7, durSec: 0.8, note: 41, gain: 0.6 },
    { atSec: 2.55, durSec: 0.8, note: 43, gain: 0.6 },
    { atSec: 3.4, durSec: 0.8, note: 40, gain: 0.6 },
    { atSec: 4.25, durSec: 0.8, note: 45, gain: 0.6 },
    { atSec: 5.1, durSec: 0.8, note: 41, gain: 0.6 },
    { atSec: 5.95, durSec: 1.1, note: 36, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'three-pedals-toe-before-the-heel',
    name: 'Toe before the heel',
    category: 'string',
    description:
      'A long swelled steel whose pedals take four tenths of a second, with chorused repeats, some added brightness and a long plate.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, sustain: 28, glide: 380, vibrato: 8, pick: 0.55, tone: 3800 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { mix: 0.5, feedback: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-ankle-not-leg',
    name: 'Ankle, not leg',
    category: 'plucked',
    description:
      'A thumb-picked dark steel with slow pedals and no shake, through a woolly amplifier and a narrow warm spring.',
    preview: TENTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 18, glide: 620, vibrato: 0, pick: 0.05, tone: 1600 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'three-pedals-knee-against-the-rail',
    name: 'Knee against the rail',
    category: 'bell',
    description:
      'A hard bright pick with quick pedals and no swell, a two-octave sparkle in its reverb and a thin fading echo.',
    preview: HIGH_SIXTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 26, glide: 110, tone: 5800, vibrato: 3 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { mix: 0.25 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.26 } },
    ],
  },
  {
    id: 'three-pedals-sung-on-one-string',
    name: 'Sung on one string',
    category: 'string',
    description:
      'A swelled lead steel with a slow wide bar vibrato, three deep slow chorus voices behind it and a medium plate.',
    preview: ONE_STRING,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { volume: -1, range: 2, vibrato: 24, rate: 4, swell: 0.8, sustain: 24 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4, feedback: 10 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'three-pedals-shoe-left-on-the-bar',
    name: 'Shoe left on the bar',
    category: 'pad',
    description:
      'A two-second swell on dark strings; whatever is common to one moment and the next hangs on in the chain.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 2, sustain: 40, glide: 500, vibrato: 5, pick: 0.2, tone: 2000, range: 2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-half-way-and-held',
    name: 'Half way and held',
    category: 'string',
    description:
      'A softly picked steel with pedals of half a second, its strings answered by sympathetic ones tuned to E minor.',
    preview: HALF_PRESS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { range: 2, swell: 0.1, sustain: 16, glide: 520, tone: 2600, pick: 0.35 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Hammered',
        params: { decay: 6, mix: 0.5, sympathy: 0.6 },
      },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'three-pedals-three-seconds-of-foot',
    name: 'Three seconds of foot',
    category: 'pad',
    description:
      'The slowest pedal the steel has on a forty-second string, swelled in and trailed by a soft pad that follows it.',
    preview: CREEP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 1.6, sustain: 40, glide: 800, vibrato: 0, range: 2, tone: 2800, pick: 0.3 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 2, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'three-pedals-lever-on-the-way-down',
    name: 'Lever on the way down',
    category: 'string',
    description:
      'A medium swell and a medium bend put through a slow rotating cabinet, with a short dark room after it.',
    preview: KNEE_DOWN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.5, sustain: 20, glide: 260, vibrato: 0, tone: 3600 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'three-pedals-lever-on-the-way-up',
    name: 'Lever on the way up',
    category: 'string',
    description:
      'A clear steel with no vibrato, its bends of a third of a second doubled backwards in slow overlapping swells.',
    preview: KNEE_UP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        volume: -4.5,
        swell: 0.9,
        sustain: 26,
        glide: 330,
        vibrato: 0,
        pick: 0.6,
        tone: 4200,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.42 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'three-pedals-let-up-by-half',
    name: 'Let up by half',
    category: 'string',
    description:
      'A long steel swell with slow pedals, worn and dulled by a small reel of tape, then a low warm hall.',
    preview: HALF_LIFT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { range: 2, swell: 1.1, sustain: 30, glide: 560, vibrato: 6, tone: 2300 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.35, hiss: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-rhinestone-and-dust',
    name: 'Rhinestone and dust',
    category: 'plucked',
    description:
      'A bright bare pick with fast pedals into a dripping surf spring, with an even amplifier tremolo over both.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { range: 2, sustain: 20, glide: 70, vibrato: 4, pick: 0.9, tone: 5600 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.35 } },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5.2, depth: 0.4 } },
    ],
  },
  {
    id: 'three-pedals-fret-bar-in-a-chapel',
    name: 'Fret bar in a chapel',
    category: 'organ',
    description:
      'A steel swelled for over a second whose copies on organ stops, from a sub up to two octaves above, speak late behind it.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.3, sustain: 32, glide: 420, pick: 0.4, tone: 3000 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Slow bloom', params: { speak: 900, mix: 0.65 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-cloth-under-the-bar',
    name: 'Cloth under the bar',
    category: 'plucked',
    description:
      'Strings that die in three seconds, softly thumbed and dark, with quick pedals, in a wooden body.',
    preview: QUICK_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short bloom',
      params: { volume: -6.5, range: 2, swell: 0, sustain: 3, glide: 90, pick: 0.15, tone: 1800 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.65 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'three-pedals-copedent-in-fog',
    name: 'Copedent in fog',
    category: 'pad',
    description:
      'A steel with all its attack blurred by three layers of diffusion and no tail, two octaves of light above it.',
    preview: DORIAN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { range: 2, swell: 0.6, sustain: 30, glide: 300, vibrato: 0, tone: 4800 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up1: 0.35, up2: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-last-coach-out-of-town',
    name: 'Last coach out of town',
    category: 'texture',
    description:
      'A steel heard over a shortwave link that fades and drifts, its vibrato wide and slow, a late hall behind.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { range: 2, vibrato: 20, rate: 3.6, swell: 0.6, sustain: 22, glide: 280, tone: 4600 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { static: 0.15, interference: 0.05, fading: 0.45 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-string-three-half-open',
    name: 'String three, half open',
    category: 'drone',
    description:
      'A dark steel with an octave and two octaves added below it and a fifth-tuned table of bowls ringing behind.',
    preview: TENTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { range: 2, swell: 1.5, sustain: 40, glide: 450, vibrato: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.45, sub1: 0.45 } },
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 0, mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-two-pullers-one-cord',
    name: 'Two pullers, one cord',
    category: 'string',
    description:
      'A plain clean steel with two followers behind it at the same pitch, a second and a half apart, growing fainter.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        volume: -4,
        swell: 0.2,
        sustain: 11,
        glide: 150,
        pick: 0.5,
        tone: 3400,
        vibrato: 5,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, mix: 0.45, tone: 5000 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'three-pedals-changer-at-the-bridge',
    name: 'Changer at the bridge',
    category: 'bell',
    description:
      'A bridge-bright pick, quick pedals and a bell-coloured formant, with scattered points of echo to either side.',
    preview: HIGH_SIXTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 22, glide: 60, vibrato: 0, tone: 6000 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Bright bell', params: { amount: 0.9 } },
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-slow-dance-back-room',
    name: 'Slow dance, back room',
    category: 'string',
    description:
      'A swelled steel with a shallow bar shake, played through a combo at the far end of a hall and lifted by a light limiter.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.7, sustain: 18, glide: 240, vibrato: 14, rate: 5.4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'three-pedals-nothing-but-the-rod',
    name: 'Nothing but the rod',
    category: 'texture',
    description:
      'Only what changes is kept: the bend is heard and the strings that stand still are turned down behind it.',
    preview: KNEE_UP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { range: 2, swell: 0.8, sustain: 40, glide: 700, vibrato: 0, tone: 5000, pick: 0.7 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'New notes ring',
        params: { ring: 0.4, mix: 0.6, floor: -14 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'three-pedals-nothing-but-the-stay',
    name: 'Nothing but the stay',
    category: 'drone',
    description:
      'Only what stays is kept: the two strings that do not move outlast the one that does, in a long dark hall.',
    preview: CREEP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 0.9, sustain: 40, glide: 600, tone: 3400, pick: 0.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what stays', params: { ring: 0.6, mix: 0.9 } },
      {
        deviceId: 'expanse',
        preset: 'Low cathedral',
        params: { mix: 0.35, highCut: 1800, decay: 14 },
      },
    ],
  },
  {
    id: 'three-pedals-dry-rod-quick-foot',
    name: 'Dry rod, quick foot',
    category: 'plucked',
    description:
      'A hard dry pick with a pedal of forty milliseconds, short in the string, with a single tape slap behind it.',
    preview: QUICK_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { volume: -9, range: 2, sustain: 6, glide: 40 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'three-pedals-tall-grass-no-wind',
    name: 'Tall grass, no wind',
    category: 'pad',
    description:
      'A swelled dark steel with slow pedals that is spread among six distant copies, dulled by the air between.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { range: 2, swell: 1.8, sustain: 34, glide: 640, vibrato: 0, tone: 1900 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Wide and dull', params: { mix: 0.7, birds: 6 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'three-pedals-both-feet-on-the-floor',
    name: 'Both feet on the floor',
    category: 'string',
    description:
      'A steel of medium swell with no modulation at all, squashed until its tail stands level, in a short plate.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.3, sustain: 30, glide: 200, vibrato: 0, pick: 0.7, tone: 2600 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'three-pedals-felt-on-the-pedal-board',
    name: 'Felt on the pedal board',
    category: 'pad',
    description:
      'A soft thumb and half a second of swell; a low-pass opens with each pick and shuts slowly, in a blooming reverb.',
    preview: HALF_PRESS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { volume: -4, swell: 0.5, sustain: 20, glide: 400, vibrato: 4, tone: 2600, range: 2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 3, cutoffHz: 480 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'three-pedals-chrome-in-the-dark',
    name: 'Chrome in the dark',
    category: 'string',
    description:
      'A bright swelled steel in a spectral blur that hangs each chord as a glassy shimmering halo over the next.',
    preview: HALF_LIFT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { range: 2, vibrato: 6, swell: 0.8, sustain: 25, glide: 350, tone: 5400 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'three-pedals-leaning-on-the-changer',
    name: 'Leaning on the changer',
    category: 'drone',
    description:
      'A forty-second string fed back on itself until the held notes bloom into one overtone, in a narrow tunnel.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { range: 2, swell: 2, sustain: 40, glide: 480, vibrato: 3, tone: 2500, pick: 0.5 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { width: 0.6 } },
    ],
  },
  {
    id: 'three-pedals-foot-rocking-on-gravel',
    name: 'Foot rocking on gravel',
    category: 'string',
    description:
      'A half-swelled steel with fast pedals, its bands swelling and drifting on slow cycles of their own, and dry.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { range: 2, swell: 0.4, sustain: 14, glide: 120, tone: 4800, pick: 0.7 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.2, depth: 0.7 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'three-pedals-wire-that-remembers',
    name: 'Wire that remembers',
    category: 'texture',
    description:
      'A slow steel whose last moments drift back under it, some backwards, some at half speed, duller than before.',
    preview: KNEE_DOWN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Swelling slide',
      params: { range: 2, swell: 1, sustain: 12, glide: 440, volume: -3 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Hazy past',
        params: { time: 700, mix: 0.55, tone: 2200 },
      },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'three-pedals-seat-by-the-steel-man',
    name: 'Seat by the steel man',
    category: 'string',
    description:
      'A close dry steel, picked hard and barely swelled, through a triode pushed half way, with the hum of an amp left on.',
    preview: KNEE_UP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 0.15,
        sustain: 13,
        glide: 180,
        vibrato: 10,
        rate: 5.8,
        pick: 0.75,
        tone: 4300,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -56 } },
    ],
  },
  {
    id: 'three-pedals-heel-still-warm',
    name: 'Heel still warm',
    category: 'pad',
    description:
      'A swelled dark steel whose tail ages: the longer it rings the further it sags in pitch, darkens and blurs.',
    preview: HALF_LIFT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { range: 2, swell: 0.7, sustain: 26, glide: 420, vibrato: 0, tone: 2600 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'three-pedals-sequins-at-noon',
    name: 'Sequins at noon',
    category: 'plucked',
    description:
      'A clean fast-pedalled pick with an octave copied above it, slightly detuned, and a short bright chamber.',
    preview: HIGH_SIXTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { volume: -10.5, range: 2, swell: 0, sustain: 30, glide: 80, vibrato: 0, pick: 0.85 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.5 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'three-pedals-ninth-string-left-alone',
    name: 'Ninth string, left alone',
    category: 'drone',
    description:
      'A very slow pedal under a two-second swell, the strongest partials drawn again as sines that linger after it.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { volume: -3.5, swell: 2, sustain: 40, glide: 800, tone: 1700, pick: 0.1 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.55 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'three-pedals-motel-sign-letter-out',
    name: 'Motel sign, letter out',
    category: 'string',
    description:
      'A shaken steel chopped loud and low by a square tremolo, twice a second, into a dark spring with one coil.',
    preview: KNEE_DOWN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.1, sustain: 20, glide: 140, vibrato: 18, rate: 6, tone: 3800 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'On and off', params: { rate: 2.2, depth: 0.7, smooth: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-volume-foot-first',
    name: 'Volume foot first',
    category: 'string',
    description:
      'A steel with no swell of its own loses its pick to a quarter-second volume swell, with dark echoes after it.',
    preview: DORIAN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { range: 2, swell: 0, vibrato: 9, rate: 4.8, sustain: 22, glide: 230, tone: 4000 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'analog-delay', preset: 'Dark echo' },
    ],
  },
  {
    id: 'three-pedals-bar-laid-on-its-side',
    name: 'Bar laid on its side',
    category: 'texture',
    description:
      'A short-ringing steel scattered into small grains an octave up that echo after it, its lows thinned out.',
    preview: QUICK_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short bloom',
      params: { volume: -7, range: 2, sustain: 7, glide: 180, swell: 0.15, tone: 5000 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.38 } },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'three-pedals-third-pedal-first-snow',
    name: 'Third pedal, first snow',
    category: 'pad',
    description:
      'A swelled steel with slow pedals at the thin frozen end of the year, in a wide space, its long tails lifted.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { volume: -15, range: 2, swell: 1.2, glide: 540, vibrato: 0, sustain: 34 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'Deep winter' },
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -28, amount: 0.8 } },
    ],
  },
  {
    id: 'three-pedals-neither-rod-in-tune',
    name: 'Neither rod in tune',
    category: 'string',
    description:
      'A bright steel with copies fourteen cents sharp on one side and flat on the other, the detuned pair fed back.',
    preview: KNEE_UP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Swelling slide',
      params: { range: 2, swell: 0.6, sustain: 18, glide: 300, vibrato: 0, tone: 4600, volume: -4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'three-pedals-steel-under-the-bridge',
    name: 'Steel under the bridge',
    category: 'string',
    description:
      'A steel taken under water: muffled, wavering slowly and closing in from the sides, with no bubbles.',
    preview: TENTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.6, sustain: 24, glide: 360, vibrato: 0, tone: 5200, pick: 0.6 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Under', params: { bubbles: 0, depth: 0.4, waver: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'three-pedals-backstop-and-spring',
    name: 'Backstop and spring',
    category: 'plucked',
    description:
      'A short picked string with quick pedals skipping away in closer and closer echoes from side to side.',
    preview: QUICK_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { range: 2, sustain: 5, glide: 70, tone: 4200, pick: 0.6 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'three-pedals-cradle-of-the-lap',
    name: 'Cradle of the lap',
    category: 'plucked',
    description:
      'A lap slide set to pedal range, played on a worn record with slow warp, dust and a dulled groove.',
    preview: ONE_STRING,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { range: 2, sustain: 14, glide: 190, vibrato: 12, tone: 3200 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { pops: 0.05 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'three-pedals-seven-hills-of-one-bend',
    name: 'Seven hills of one bend',
    category: 'pad',
    description:
      'A long swelled steel with slow pedals in a reverb that climbs a fifth at every pass, both dulled as if far off.',
    preview: CREEP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { range: 2, swell: 1.4, sustain: 36, glide: 760, vibrato: 8, rate: 3.2, tone: 3600 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.42 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'three-pedals-split-the-pedal',
    name: 'Split the pedal',
    category: 'string',
    description:
      'A mid swelled steel through a slow six-stage phaser with negative feedback, hollow in the middle, then a room.',
    preview: HALF_PRESS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.5, sustain: 28, glide: 280, vibrato: 4, pick: 0.75, tone: 5000 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.12 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'three-pedals-shoebox-of-tab',
    name: 'Shoebox of tab',
    category: 'texture',
    description:
      'A steel on an early sampler with its top gone and its levels coarse, played again by a one-second loop of tape.',
    preview: KNEE_DOWN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { range: 2, swell: 0.3, sustain: 10, glide: 240, tone: 3000 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Muffled sampler', params: { tone: 0.25 } },
      { deviceId: 'tape-loop', preset: 'One second round', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'three-pedals-barn-owl-over-the-strip',
    name: 'Barn owl over the strip',
    category: 'pad',
    description:
      'A slowly swelled steel whose hall sings an open vowel back at it, the whole made a little wider than it was.',
    preview: KNEE_UP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { volume: -2, range: 2, swell: 1.2, sustain: 26, glide: 380, tone: 3400, vibrato: 8 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.55 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'three-pedals-fog-lamps-on-the-grade',
    name: 'Fog lamps on the grade',
    category: 'drone',
    description:
      'A dark steel into a short reverb, a soft fuzz and a long reverb, until the held strings glow as one wall.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { volume: -6, swell: 1, sustain: 30, glide: 460, range: 2, vibrato: 0, tone: 2200 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.5 } }],
  },
  {
    id: 'three-pedals-every-rod-adjusted',
    name: 'Every rod adjusted',
    category: 'string',
    description:
      'A level clear steel with a medium bend, what is quiet in it turned up band by band until overtones show.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { swell: 0.5, sustain: 20, glide: 210, vibrato: 0, pick: 0.7, tone: 4400 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { mix: 0.9 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'three-pedals-two-tone-boots',
    name: 'Two-tone boots',
    category: 'string',
    description:
      'A steel ridden round the head on a slow pendulum, its swell short and its pedal a fifth of a second.',
    preview: DORIAN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: {
        volume: -2,
        range: 2,
        vibrato: 12,
        swell: 0.3,
        sustain: 16,
        glide: 200,
        tone: 3700,
      },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'three-pedals-grange-hall-chairs-up',
    name: 'Grange hall, chairs up',
    category: 'pad',
    description:
      'A soft swelled steel heard from the back of a hall, far, dull and late, with nothing else in the chain but a lift.',
    preview: HALF_LIFT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 0.8, sustain: 30, glide: 400, vibrato: 6, tone: 4000, pick: 0.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall' },
      { deviceId: 'lift', preset: 'Quiet end up' },
    ],
  },
  {
    id: 'three-pedals-cable-around-the-wheel',
    name: 'Cable around the wheel',
    category: 'texture',
    description:
      'Small pieces of the bend are caught and each one slides down a third as it fades, under a swelled steel.',
    preview: CREEP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { range: 2, swell: 0.6, sustain: 20, vibrato: 0, tone: 4200 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-bar-dew',
    name: 'Bar dew',
    category: 'pad',
    description:
      'Glassy high strings with a full second of swell, each band of them catching the light on its own tremolo.',
    preview: HIGH_SIXTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { volume: -4.5, swell: 1, sustain: 30, glide: 260, pick: 0.9, tone: 6000 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints', params: { depth: 0.8, rate: 2 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'three-pedals-root-held-by-the-knee',
    name: 'Root held by the knee',
    category: 'drone',
    description:
      'The steel caught and held as an even dark pad that glides over from each chord to the next, behind the strings.',
    preview: DORIAN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { volume: -5, range: 2, swell: 0.9, sustain: 18, glide: 520, vibrato: 0, tone: 1800 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.6, decay: 12 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'three-pedals-pick-then-silence',
    name: 'Pick, then silence',
    category: 'plucked',
    description:
      'A soft pick on a string of two and a half seconds, in a reverb that holds level a third of a second and stops dead.',
    preview: QUICK_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 2.5, glide: 130, range: 2, pick: 0.3, tone: 3000 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.5 } },
      { deviceId: 'saturator', preset: 'Warm glue' },
    ],
  },
  {
    id: 'three-pedals-half-of-a-late-pedal',
    name: 'Half of a late pedal',
    category: 'pad',
    description:
      'A dark steel carried down by a spiral of gliding voices that sinks for as long as it rings, behind a late bend.',
    preview: LATE_FOOT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { range: 2, swell: 1.6, sustain: 24, glide: 700, vibrato: 0, tone: 1700 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Deep below', params: { mix: 0.5 } }],
  },
  {
    id: 'three-pedals-worn-at-the-first-pedal',
    name: 'Worn at the first pedal',
    category: 'string',
    description:
      'A swelled steel on a warped cassette with rough edges, its wobble wider than its bar shake, and a worn tape echo.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: {
        volume: -7.5,
        range: 2,
        swell: 0.9,
        sustain: 16,
        glide: 280,
        vibrato: 5,
        tone: 5200,
        pick: 0.9,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2, wobble: 0.75 } },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.3, feedback: 0.4 } },
    ],
  },
  {
    id: 'three-pedals-six-strings-one-shoe',
    name: 'Six strings, one shoe',
    category: 'pad',
    description:
      'The steel shrunk to a smaller body with its notes left alone, swelled and set in a swarm of short echoes.',
    preview: KNEE_UP,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { range: 2, swell: 0.9, sustain: 30, glide: 320, vibrato: 0, tone: 5000, pick: 0.4 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller' },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'three-pedals-chord-that-only-breathes',
    name: 'Chord that only breathes',
    category: 'pad',
    description:
      'A long steel opened and closed by a breath of three seconds in and four and a half out, its air rising with it.',
    preview: ROCKED,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: {
        range: 2,
        swell: 0.5,
        sustain: 40,
        glide: 620,
        vibrato: 6,
        rate: 3.4,
        tone: 3000,
        pick: 0.3,
      },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.6, width: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'three-pedals-cantina-fan-turning',
    name: 'Cantina fan turning',
    category: 'string',
    description:
      'A rotating cabinet run fast on a mid swelled steel of hard pick, its horn bright and the bends medium.',
    preview: KNEE_DOWN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: {
        volume: -7.5,
        range: 2,
        vibrato: 0,
        swell: 0.4,
        sustain: 18,
        glide: 260,
        tone: 5200,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Bright horn' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'three-pedals-colour-fan-of-one-string',
    name: 'Colour fan of one string',
    category: 'string',
    description:
      'A picked steel split into twelve colours that come back low to high, so each bend unfolds after itself.',
    preview: ONE_STRING,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.05, sustain: 17, glide: 170, vibrato: 7, pick: 0.65, tone: 4800 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.42 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'three-pedals-far-porch-two-pedals',
    name: 'Far porch, two pedals',
    category: 'string',
    description:
      'A steel out in the weather: passing clouds dim and dull it by turns and a little wind is heard between.',
    preview: HALF_LIFT,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Swelling slide',
      params: { range: 2, swell: 0.7, sustain: 20, glide: 340, vibrato: 9, tone: 3900, volume: -3 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Passing clouds', params: { pace: 3, voice: 0.15 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'three-pedals-hand-changes-the-fret',
    name: 'Hand changes the fret',
    category: 'plucked',
    description:
      'A clean neck-pickup guitar strummed over forty milliseconds, lightly chorused and then sent down a long dark spring.',
    preview: GRIP,
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { volume: -1, hardness: 0.4, sustain: 12, strum: 40, tone: 3000 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Underwater', params: { mix: 0.35, tone: 1200 } },
    ],
  },
  {
    id: 'three-pedals-faded-in-like-a-steel',
    name: 'Faded in like a steel',
    category: 'string',
    description:
      'A guitar swelled for over a second at every note as a steel would be, lifted by a light limiter, with a soft octave and a long plate.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { volume: 6, sustain: 24, swell: 1.5, tone: 3400 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'three-pedals-one-finger-lifts',
    name: 'One finger lifts',
    category: 'plucked',
    description:
      'Bright twangy bridge strings squashed hard by a limiter, a dotted tape bounce answering the pick.',
    preview: PICKED,
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { volume: 5, sustain: 9, strum: 0, tone: 5000 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-fourth-finger-to-a',
    name: 'Fourth finger to A',
    category: 'pad',
    description:
      'A guitar with its attacks softened by two layers of diffusion, the blurred chord then opened and closed by a long sigh.',
    preview: GRIP,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { volume: -1.5, sustain: 20, tone: 3600, strum: 80 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'breath', preset: 'Long slow sigh', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'three-pedals-c-string-never-moves',
    name: 'C string never moves',
    category: 'drone',
    description:
      'A thick low-toned guitar; tones that have stood for nearly a second are kept and the rest pulled down, in a dark hall.',
    preview: GRIP,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thick growl',
      params: { volume: -6, sustain: 26, warmth: 0.5, strum: 20 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-parlour-without-a-bar',
    name: 'Parlour without a bar',
    category: 'plucked',
    description:
      'A thumbed neck-pickup guitar with a very short dark string, in the body of a soundboard and a tight chamber.',
    preview: PICKED,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { volume: 2.5, sustain: 3, tone: 1600, warmth: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5, tone: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'three-pedals-twelve-wires-bent-by-ear',
    name: 'Twelve wires bent by ear',
    category: 'plucked',
    description:
      'A shimmering twelve-string guitar rolled at eighty milliseconds, its bands drifting from side to side in a bright tail.',
    preview: GRIP,
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { volume: 0.5, strum: 80, sustain: 16, shimmer: 1.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Side to side', params: { rate: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-amp-at-the-end-of-town',
    name: 'Amp at the end of town',
    category: 'string',
    description:
      'A warm guitar pushed into breakup, then through a stack close up, with a very short ambience after it.',
    preview: GRIP,
    instrument: {
      deviceId: 'guitar',
      preset: 'Warm breakup',
      params: { volume: -4, sustain: 20, swell: 0.3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'three-pedals-harp-pedals-for-guitar',
    name: 'Harp pedals for guitar',
    category: 'plucked',
    description:
      'A wide slow roll on long open strings, answered by strings in sympathy that ring on in C for seven seconds.',
    preview: GRIP,
    instrument: { deviceId: 'guitar', preset: 'Harp roll', params: { sustain: 12, tone: 4200 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { root: 0, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'three-pedals-barre-held-a-bar-longer',
    name: 'Barre held a bar longer',
    category: 'pad',
    description:
      'A slow warm swell that a follower turns into low strings, the pad rising under the guitar as it comes in.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { swell: 1.2, warmth: 0.4, tone: 3000 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { mix: 0.5, rise: 1.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'three-pedals-two-chords-on-cassette',
    name: 'Two chords on cassette',
    category: 'plucked',
    description:
      'A muted short-stringed guitar on a four-track cassette with its hiss and wow left in, and a slap behind it.',
    preview: PICKED,
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { volume: 2.5, sustain: 2.2, hardness: 0.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'three-pedals-bell-of-the-open-c',
    name: 'Bell of the open C',
    category: 'bell',
    description:
      'A hard bell-like pick near the bridge, its small room ringing two octaves up, the whole spread wide.',
    preview: PICKED,
    instrument: { deviceId: 'guitar', preset: 'Clean bell', params: { volume: 6, sustain: 20 } },
    effects: [
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { mix: 0.35 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'three-pedals-baritone-under-the-steel',
    name: 'Baritone under the steel',
    category: 'bass',
    description:
      'A dark baritone guitar with an octave folded in beneath it, gently levelled and its lows raised.',
    preview: ROOTS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { volume: -2.5, sustain: 15, tone: 1700, strum: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'three-pedals-reeled-off-backwards',
    name: 'Reeled off backwards',
    category: 'texture',
    description:
      'A hidden-pick guitar, limited, turned round by a reverse delay that answers each change with the one before, an octave up.',
    preview: PICKED,
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: { volume: 6, sustain: 14, tone: 3600 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-stopped-strings-two-off',
    name: 'Stopped strings, two off',
    category: 'plucked',
    description:
      'Dark damped guitar stops, short and thick, skipping off in echoes that come slower and duller from side to side.',
    preview: PICKED,
    instrument: { deviceId: 'guitar', preset: 'Dark stops', params: { tone: 2200 } },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Long way out', params: { mix: 0.4 } },
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 5, outputDb: -4 } },
    ],
  },
  {
    id: 'three-pedals-roundhouse-wall',
    name: 'Roundhouse wall',
    category: 'texture',
    description:
      'A dry rolled chord caught and thrown back by a swarm of short echoes that bend slowly in pitch as they go.',
    preview: GRIP,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dry rolled chord',
      params: { sustain: 6, tone: 3600 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Bending', params: { mix: 0.45 } }],
  },
  {
    id: 'three-pedals-third-string-sings-last',
    name: 'Third string sings last',
    category: 'drone',
    description:
      'A swelled guitar redrawn as six gliding sines an octave higher that linger over it, the guitar itself kept low.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { volume: -1, swell: 0.8, tone: 2000, shimmer: 0 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-wagon-lamp-swinging',
    name: 'Wagon lamp swinging',
    category: 'string',
    description:
      'A clean guitar through a fast wide rotating speaker and a two-spring tank, softly picked away from the bridge.',
    preview: GRIP,
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.15, position: 0.3, sustain: 10 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'three-pedals-two-frets-by-daylight',
    name: 'Two frets by daylight',
    category: 'texture',
    description:
      'A guitar on a day of light rain that taps over it, its bright strings dulled a little and swaying.',
    preview: PICKED,
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { volume: 3.5, sustain: 8, shimmer: 0.2, hardness: 0.3 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'three-pedals-the-guitar-sits-this-out',
    name: 'The guitar sits this out',
    category: 'pad',
    description:
      'A swelled guitar smeared until each chord dissolves slowly over the one before, a slow notch moving through it.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 0.9, sustain: 30, pickup: 0.9, tone: 2400 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.8 } },
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'three-pedals-bow-takes-the-pedal',
    name: 'Bow takes the pedal',
    category: 'string',
    description:
      'A bowed string with a strong body and a medium attack, close and dry but for a short dark room.',
    preview: GRIP,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.3, release: 1, vibrato: 0.15, brightness: 0.45 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room' },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'three-pedals-bow-arm-knee-still',
    name: 'Bow arm, knee still',
    category: 'pad',
    description:
      'A glassy light bow with two seconds of attack and a long release, set in a bright hall with a faint glimmer.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 2, release: 3 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen', params: { depth: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'three-pedals-held-by-its-own-hum',
    name: 'Held by its own hum',
    category: 'drone',
    description:
      'A sustained string near octave feedback, made dark and slow, a little amplifier howl added and a dark plate.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 1.4, release: 3, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Faint sustain', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-pedals-pluck-the-one-that-moves',
    name: 'Pluck the one that moves',
    category: 'plucked',
    description:
      'A felted pluck on a woody string, its top rolled off and its lows raised, with a faint single tape slap.',
    preview: PICKED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { decay: 7, brightness: 0.25 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'three-pedals-wire-over-the-pasture',
    name: 'Wire over the pasture',
    category: 'plucked',
    description:
      'A bright long-ringing plucked wire with sympathetic strings in A minor ringing on behind it.',
    preview: PICKED,
    instrument: { deviceId: 'bowed-string', preset: 'Wire harp', params: { decay: 20, detune: 8 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.5 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'three-pedals-gut-on-the-second-rod',
    name: 'Gut on the second rod',
    category: 'string',
    description:
      'A raspy close bow with full pressure and a fast shake, tamed by a valve stage and a low filter.',
    preview: GRIP,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { volume: -14, attack: 0.2, release: 0.8, brightness: 0.6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 1800 } },
    ],
  },
  {
    id: 'three-pedals-thirds-in-a-tin-roof',
    name: 'Thirds in a tin roof',
    category: 'string',
    description:
      'A soft flautando bow near the middle of the string, heard through a fading far station on the shortwave.',
    preview: GRIP,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.6, release: 1.5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Far station', params: { static: 0.2, fading: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'three-pedals-section-on-one-lever',
    name: 'Section on one lever',
    category: 'pad',
    description:
      'A detuned bowed section with slow vibrato and a full body, spread by a thick ensemble flying round the listener.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 1.5, release: 3 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'three-pedals-still-tone-moving-third',
    name: 'Still tone, moving third',
    category: 'drone',
    description:
      'A pure dark sustained tone with no body or shake, organ copies a fifth above and an octave below speaking just after it.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 1.6, release: 4 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'three-pedals-slack-strings-beating',
    name: 'Slack strings beating',
    category: 'plucked',
    description:
      'Plucked strings a quarter of a semitone wide, ringing long, sagging in a slow warm melt of their own tail.',
    preview: GRIP,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { decay: 15, release: 6 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.5 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'three-pedals-damped-then-let-ring',
    name: 'Damped, then let ring',
    category: 'plucked',
    description:
      'A heavily damped pluck of dull wood, its short notes caught and held for a couple of seconds by a sustainer.',
    preview: PICKED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { volume: -7.5, decay: 2, brightness: 0.2 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch', params: { mix: 0.5 } },
      { deviceId: 'vessel', preset: 'Hint of wood' },
    ],
  },
  {
    id: 'three-pedals-feed-the-string-slowly',
    name: 'Feed the string slowly',
    category: 'pad',
    description:
      'A slow beating swell, dull and heavy in the body, rocked by a slow tremolo and the wow of an old slow tape.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { volume: -12, attack: 1.8, release: 5, detune: 14 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { depth: 0.6 } },
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.5, hiss: 0.1 } },
    ],
  },
  {
    id: 'three-pedals-twelfths-above-the-pedal',
    name: 'Twelfths above the pedal',
    category: 'drone',
    description:
      'A bright partial held near the middle of the string, the whole drifting through a twelve-stage phaser into thin air.',
    preview: HANDED_OVER,
    instrument: { deviceId: 'bowed-string', preset: 'Twelfth glow', params: { attack: 1.2 } },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Thin air' },
    ],
  },
  {
    id: 'three-pedals-two-held-one-handed-on',
    name: 'Two held, one handed on',
    category: 'string',
    description:
      'A quick sustained string with a lively shake, answered a second later by its own line turned backwards.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { volume: -14.5, brightness: 0.55, attack: 0.15, release: 0.6 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Crab canon', params: { mix: 0.35, gap: 1 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'three-pedals-swell-without-a-foot',
    name: 'Swell without a foot',
    category: 'string',
    description:
      'A plucked string faded in over four tenths of a second, its repeats slow and murky, all made a little wider.',
    preview: PICKED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: 1.5, attack: 0.4, decay: 10 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.45 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'three-pedals-loft-above-the-dance',
    name: 'Loft above the dance',
    category: 'pad',
    description:
      'A soft bow with no pressure, taken away to the far shore of a large room and left there with its tail lifted.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { volume: -15, attack: 1, body: 0.6, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { distance: 0.75 } },
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -28, amount: 0.8 } },
    ],
  },
  {
    id: 'three-pedals-low-string-two-shoes',
    name: 'Low string, two shoes',
    category: 'bass',
    description:
      'A bowed string with its body full up, two octaves added beneath it and the top shut off, for roots.',
    preview: ROOTS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { volume: -13.5, attack: 0.15, release: 0.6, body: 1, brightness: 0.2, vibrato: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.2, sub1: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'three-pedals-rosin-in-the-fan-heater',
    name: 'Rosin in the fan heater',
    category: 'texture',
    description:
      'A raspy bow with its pressure and its top eased, run into a hazy wall of fuzz that adds an octave above.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.8, pressure: 0.6, brightness: 0.5, release: 3 },
    },
    effects: [{ deviceId: 'haze', preset: 'Octave glow', params: { mix: 0.55 } }],
  },
  {
    id: 'three-pedals-sustain-with-no-player',
    name: 'Sustain with no player',
    category: 'drone',
    description:
      'A plain sustained string with no shake, trailed by a slow cloud of itself eight times as long, and dulled.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: { vibrato: 0, brightness: 0.6, attack: 0.6 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'three-pedals-glass-pressed-home',
    name: 'Glass pressed home',
    category: 'texture',
    description:
      'A thin bright bow with no body, its partials stretched further apart, a faint octave rising in the reverb.',
    preview: HANDED_OVER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.7, release: 4, brightness: 1, body: 0 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { mix: 0.5 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } },
    ],
  },
]
