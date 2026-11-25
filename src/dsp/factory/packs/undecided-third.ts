import { type FactoryPreset, type Phrase } from '../types'

// A pure fifth that stands still and one third that drifts inside it: septimal minor, minor, neutral,
// major, septimal major (267, 316, 347, 386 and 435 cents over the root). Laid out by instrument, each
// walked from a third that barely moves to one that will not keep still, and from close to far away.

// C and G in two octaves; the third climbs through all five places, each swell over the end of the last.
const DAWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 7.3, note: 55.02, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 60, gain: 0.3 },
    { atSec: 0, durSec: 7.3, note: 67.02, gain: 0.26 },
    { atSec: 0.2, durSec: 1.8, note: 62.67, gain: 0.55 },
    { atSec: 1.6, durSec: 1.8, note: 63.16, gain: 0.55 },
    { atSec: 3, durSec: 1.8, note: 63.47, gain: 0.55 },
    { atSec: 4.4, durSec: 1.8, note: 63.86, gain: 0.55 },
    { atSec: 5.8, durSec: 1.5, note: 64.35, gain: 0.55 },
  ],
}
// The same walk downward over A and E, the third a tenth above the bass.
const DUSK: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 45, gain: 0.42 },
    { atSec: 0, durSec: 7.3, note: 52.02, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 64.02, gain: 0.26 },
    { atSec: 0.2, durSec: 1.9, note: 61.35, gain: 0.55 },
    { atSec: 1.7, durSec: 1.9, note: 60.86, gain: 0.55 },
    { atSec: 3.2, durSec: 1.8, note: 60.47, gain: 0.55 },
    { atSec: 4.6, durSec: 1.8, note: 60.16, gain: 0.55 },
    { atSec: 5.9, durSec: 1.4, note: 59.67, gain: 0.55 },
  ],
}
// Major and minor sounded together over D and A: the major one loud, then the minor one.
const SWAP: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 50, gain: 0.42 },
    { atSec: 0, durSec: 7.3, note: 57.02, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 69.02, gain: 0.24 },
    { atSec: 0.2, durSec: 3.7, note: 65.86, gain: 0.6 },
    { atSec: 0.7, durSec: 2.8, note: 65.16, gain: 0.24 },
    { atSec: 3.6, durSec: 3.7, note: 65.16, gain: 0.6 },
    { atSec: 4.3, durSec: 2.7, note: 65.86, gain: 0.24 },
  ],
}
// A solo line over D and A that knows one third only, the neutral one.
const NEUTRAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 50, gain: 0.34 },
    { atSec: 0, durSec: 7.3, note: 57.02, gain: 0.3 },
    { atSec: 0.6, durSec: 1.4, note: 62, gain: 0.5 },
    { atSec: 1.8, durSec: 2.1, note: 65.47, gain: 0.62 },
    { atSec: 3.7, durSec: 1, note: 64.04, gain: 0.46 },
    { atSec: 4.5, durSec: 2.8, note: 65.47, gain: 0.6 },
  ],
}
// For a string that bends (the steel bends by half a semitone or more): minor held over C and G, pulled
// to major and let back, then pulled to the widest one.
const PULL: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.5 },
    { atSec: 0.15, durSec: 7, note: 55.02, gain: 0.42 },
    { atSec: 0.8, durSec: 6.4, note: 63.16, gain: 0.6 },
    { atSec: 2, durSec: 2.2, note: 63.86, gain: 0.55 },
    { atSec: 5.4, durSec: 1.8, note: 64.35, gain: 0.5 },
  ],
}
// The bend the other way over A and E: the widest major slackened to neutral and then to the narrowest.
const SLACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.5 },
    { atSec: 0.15, durSec: 7, note: 52.02, gain: 0.42 },
    { atSec: 0.8, durSec: 2.3, note: 61.35, gain: 0.6 },
    { atSec: 2.6, durSec: 2.3, note: 60.47, gain: 0.55 },
    { atSec: 4.4, durSec: 2.8, note: 59.67, gain: 0.5 },
  ],
}
// The question moved to the seventh over C and G: 969, 996, 1018, 1049 and 1088 cents.
const SEVENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 7.3, note: 55.02, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 60, gain: 0.3 },
    { atSec: 0.2, durSec: 1.8, note: 69.69, gain: 0.5 },
    { atSec: 1.6, durSec: 1.8, note: 69.96, gain: 0.5 },
    { atSec: 3, durSec: 1.8, note: 70.18, gain: 0.5 },
    { atSec: 4.4, durSec: 1.8, note: 70.49, gain: 0.5 },
    { atSec: 5.8, durSec: 1.5, note: 70.88, gain: 0.5 },
  ],
}
// A drone's pedal: C and G low, G again in the middle, the minor third and then the major one far above.
const LOW_FRAME: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.4, note: 36, gain: 0.46 },
    { atSec: 0, durSec: 7.4, note: 43.02, gain: 0.38 },
    { atSec: 0, durSec: 7.4, note: 55.02, gain: 0.28 },
    { atSec: 0.5, durSec: 3.8, note: 63.16, gain: 0.45 },
    { atSec: 3.6, durSec: 3.8, note: 63.86, gain: 0.45 },
  ],
}
// Bowed tenths over G and D: minor, neutral, major, and back to neutral.
const TENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 43, gain: 0.45 },
    { atSec: 0, durSec: 7.3, note: 50.02, gain: 0.38 },
    { atSec: 0.4, durSec: 2.1, note: 58.16, gain: 0.58 },
    { atSec: 2.1, durSec: 2, note: 58.47, gain: 0.58 },
    { atSec: 3.7, durSec: 2, note: 58.86, gain: 0.58 },
    { atSec: 5.3, durSec: 2, note: 58.47, gain: 0.54 },
  ],
}
// Brass on F and C, the third inside the fifth: minor, neutral, major and the wide one.
const HORN_INSIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 41, gain: 0.45 },
    { atSec: 0, durSec: 7.3, note: 48.02, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 53, gain: 0.28 },
    { atSec: 0, durSec: 7.3, note: 60.02, gain: 0.26 },
    { atSec: 0.3, durSec: 2.2, note: 56.16, gain: 0.58 },
    { atSec: 2.1, durSec: 2.2, note: 56.47, gain: 0.58 },
    { atSec: 3.9, durSec: 2.1, note: 56.86, gain: 0.58 },
    { atSec: 5.6, durSec: 1.7, note: 57.35, gain: 0.58 },
  ],
}
// D and A held low on the instrument, the third turned over and over a tenth above the D.
const FLUTE_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 62, gain: 0.34 },
    { atSec: 0, durSec: 7.3, note: 69.02, gain: 0.28 },
    { atSec: 0.4, durSec: 1.7, note: 77.16, gain: 0.55 },
    { atSec: 1.9, durSec: 1.7, note: 77.86, gain: 0.55 },
    { atSec: 3.4, durSec: 1.6, note: 77.47, gain: 0.5 },
    { atSec: 4.8, durSec: 1, note: 76.67, gain: 0.46 },
    { atSec: 5.6, durSec: 1.7, note: 77.47, gain: 0.55 },
  ],
}
// The five sevenths coming down over D and A, under a held D.
const SEVENTH_FALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 62, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 69.02, gain: 0.3 },
    { atSec: 0, durSec: 7.3, note: 74, gain: 0.24 },
    { atSec: 0.3, durSec: 1.8, note: 72.88, gain: 0.5 },
    { atSec: 1.8, durSec: 1.7, note: 72.49, gain: 0.5 },
    { atSec: 3.2, durSec: 1.7, note: 72.18, gain: 0.5 },
    { atSec: 4.6, durSec: 1.6, note: 71.96, gain: 0.5 },
    { atSec: 5.9, durSec: 1.4, note: 71.69, gain: 0.5 },
  ],
}
// E and B left open between entries: the third comes in minor, goes, comes in major, goes, comes in neither.
const DOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 7.3, note: 59.02, gain: 0.34 },
    { atSec: 0, durSec: 7.3, note: 64, gain: 0.28 },
    { atSec: 0.8, durSec: 1.5, note: 67.16, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 67.86, gain: 0.55 },
    { atSec: 5.2, durSec: 2.1, note: 67.47, gain: 0.55 },
  ],
}
// Only the two outermost thirds over G and D: the narrowest, then the widest.
const EXTREMES: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 43, gain: 0.42 },
    { atSec: 0, durSec: 7.3, note: 50.02, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 62.02, gain: 0.28 },
    { atSec: 0.4, durSec: 3.3, note: 57.67, gain: 0.55 },
    { atSec: 3.3, durSec: 4, note: 59.35, gain: 0.55 },
  ],
}

// For drones whose keys bring a fifth or a series of their own: C in two octaves, the third alone above.
const ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.4, note: 36, gain: 0.46 },
    { atSec: 0, durSec: 7.4, note: 48, gain: 0.36 },
    { atSec: 0.5, durSec: 2.8, note: 63.16, gain: 0.45 },
    { atSec: 2.8, durSec: 2.6, note: 63.47, gain: 0.45 },
    { atSec: 4.9, durSec: 2.5, note: 63.86, gain: 0.45 },
  ],
}
// For a drone whose one key is a major chord: C held, and a minor third that comes over it, goes and comes back.
const OWN_THIRD: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.4, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 7.4, note: 60, gain: 0.3 },
    { atSec: 1.5, durSec: 1.9, note: 63.16, gain: 0.5 },
    { atSec: 4.9, durSec: 2.5, note: 63.16, gain: 0.55 },
  ],
}
// Two thirds at once over A and E, major falling and minor rising: they meet on the neutral one and change places.
const CROSSING: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 57, gain: 0.38 },
    { atSec: 0, durSec: 7.3, note: 64.02, gain: 0.32 },
    { atSec: 0, durSec: 7.3, note: 69, gain: 0.26 },
    { atSec: 0.2, durSec: 2.4, note: 72.86, gain: 0.5 },
    { atSec: 0.2, durSec: 2.4, note: 72.16, gain: 0.36 },
    { atSec: 2.2, durSec: 2.9, note: 72.47, gain: 0.6 },
    { atSec: 4.7, durSec: 2.6, note: 72.16, gain: 0.5 },
    { atSec: 4.7, durSec: 2.6, note: 72.86, gain: 0.36 },
  ],
}
// The solo line of the neutral third a fourth higher, over G and D, for trumpets and flugelhorns.
const NEUTRAL_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 55, gain: 0.34 },
    { atSec: 0, durSec: 7.3, note: 62.02, gain: 0.3 },
    { atSec: 0.6, durSec: 1.4, note: 67, gain: 0.5 },
    { atSec: 1.8, durSec: 2.1, note: 70.47, gain: 0.62 },
    { atSec: 3.7, durSec: 1, note: 69.04, gain: 0.46 },
    { atSec: 4.5, durSec: 2.8, note: 70.47, gain: 0.6 },
  ],
}
// Trumpets on F and C, the third inside the upper fifth: minor, neutral, major and the wide one.
const BRASS_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 53, gain: 0.42 },
    { atSec: 0, durSec: 7.3, note: 60.02, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 65, gain: 0.28 },
    { atSec: 0, durSec: 7.3, note: 72.02, gain: 0.24 },
    { atSec: 0.3, durSec: 2.2, note: 68.16, gain: 0.55 },
    { atSec: 2.1, durSec: 2.2, note: 68.47, gain: 0.55 },
    { atSec: 3.9, durSec: 2.1, note: 68.86, gain: 0.55 },
    { atSec: 5.6, durSec: 1.7, note: 69.35, gain: 0.55 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Pedal steel: the one instrument here that can really slide from one third to the next.
  {
    id: 'undecided-third-one-slow-pull',
    name: 'One slow pull',
    category: 'string',
    preview: PULL,
    description:
      'A swelled steel whose overlapping neighbours bend over most of a second, through two springs and a warm equaliser.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.5, sustain: 30, glide: 800, vibrato: 3, pick: 0.35, tone: 2600 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Two spring tank',
        params: { decay: 4, tone: 3000, drip: 0.2, mix: 0.32 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'undecided-third-bar-on-cold-glass',
    name: 'Bar on cold glass',
    category: 'pad',
    preview: SLACK,
    description:
      'A steel with no vibrato and a two second swell, its attacks fogged away and a fifth rising faintly from the tail.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { volume: -5, swell: 2, vibrato: 0, pick: 0.1, tone: 1700, glide: 600 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 420, layers: 3, soften: 0.6 } },
      { deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.34, decay: 10, tone: 4200 } },
    ],
  },
  {
    id: 'undecided-third-needle-either-side',
    name: 'Needle either side',
    category: 'string',
    preview: PULL,
    description:
      'A steel shaken forty cents either side of the note at a slow rate, in a slow rotating cabinet set well back, with a soft echo.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { volume: -4.5, rate: 3, sustain: 18, swell: 0.3, glide: 350, range: 2, tone: 4200 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { distance: 0.7, spread: 1, drive: 0.1 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 640, feedback: 0.35, mix: 0.25 },
      },
    ],
  },
  {
    id: 'undecided-third-pulled-after-picking',
    name: 'Pulled after picking',
    category: 'plucked',
    preview: PULL,
    description:
      'A hard bright pick left to ring and bent slowly afterwards, with singing bowls tuned only to C and G beneath it.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 14, glide: 700, vibrato: 0, range: 2, tone: 5500 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 4,
          bowls: 6,
          ring: 14,
          beat: 0.25,
          strike: 0.6,
          mix: 0.4,
          register: 0.45,
        },
      },
    ],
  },
  {
    id: 'undecided-third-thumb-keeps-the-root',
    name: 'Thumb keeps the root',
    category: 'plucked',
    preview: SLACK,
    description:
      'A thumbed dark string through a combo amplifier heard down a hall, with a tape repeat that wobbles in pitch.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 9, glide: 500, range: 2, vibrato: 2, tone: 1900 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { room: 0.6, drive: 0.15, noise: 0 } },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 820, wow: 0.6, feedback: 0.3, mix: 0.28 },
      },
    ],
  },
  {
    id: 'undecided-third-porch-in-two-minds',
    name: 'Porch in two minds',
    category: 'string',
    preview: PULL,
    description:
      'A singing steel lead with a wide vibrato, left out in slow gusts that take its level and its top away and give them back.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { volume: -4.5, glide: 450, range: 2, swell: 0.6, tone: 3600 },
    },
    effects: [
      {
        deviceId: 'weather',
        preset: 'Breezy day',
        params: { voice: 0.12, exposure: 0.8, force: 0.6, sway: 0.8 },
      },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-holds-the-old-answer',
    name: 'Holds the old answer',
    category: 'pad',
    preview: PULL,
    description:
      'A long bright steel swell into a sustainer that keeps the chord it caught and slides to the next over three seconds.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 1.2, glide: 600, range: 2, vibrato: 5 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Long glide',
        params: { glide: 3, decay: 20, mix: 0.65, ensemble: 0.3, tone: -0.2 },
      },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'undecided-third-only-the-moving-string',
    name: 'Only the moving string',
    category: 'texture',
    preview: PULL,
    description:
      'A fading steel through an ear that turns down what stays the same and lets through what has just changed, in a plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.3, sustain: 8, glide: 500, range: 2, pick: 0.8, tone: 5000 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { mix: 0.85, ring: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'undecided-third-asked-again-later',
    name: 'Asked again later',
    category: 'plucked',
    preview: PULL,
    description:
      'Short steel blooms followed by a round of two: the same notes again later, then an octave up.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short bloom',
      params: { glide: 200, range: 1, swell: 0.12, sustain: 3.5, tone: 4200 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: {
          followers: 2,
          gap: 1.5,
          interval1: 0,
          interval2: 12,
          fade: 0.3,
          spread: 0.9,
          crab: 0,
          round: 0,
          mix: 0.6,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'undecided-third-slack-line-at-dusk',
    name: 'Slack line at dusk',
    category: 'string',
    preview: SLACK,
    description:
      'An unswelled string with the slowest bar, its tail sagging twenty cents every second as it darkens.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { glide: 800, range: 2, sustain: 7, pick: 0.3, tone: 2500 },
    },
    effects: [
      {
        deviceId: 'melt',
        preset: 'Soft sag',
        params: { sag: -20, hold: 8, mix: 0.6, drip: 0, dim: 0.5 },
      },
    ],
  },
  {
    id: 'undecided-third-steel-under-the-boards',
    name: 'Steel under the boards',
    category: 'drone',
    preview: SLACK,
    description:
      'A dark steel swelled in with its octave below added, pushed through iron and muffled above twelve hundred hertz.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { vibrato: 0, range: 2, glide: 500, pick: 0, sustain: 34, tone: 1500 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Deep',
        params: { sub2: 0, sub1: 0.7, up1: 0, up2: 0, dry: 0.8, filter: 2400 },
      },
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },

  // Drone: the frame itself. Shapes that have no third in them, and two that bring their own.
  {
    id: 'undecided-third-fifth-set-in-stone',
    name: 'Fifth set in stone',
    category: 'drone',
    preview: ROOTS,
    description:
      'Open fifths on every key with almost no movement, quick to speak, in a dark hall of five seconds.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { movement: 0.04, attack: 0.8, release: 2, air: 0, cutoff: 1800, width: 0.4 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3, decay: 5 } }],
  },
  {
    id: 'undecided-third-strings-tuned-minor',
    name: 'Strings tuned minor',
    category: 'drone',
    preview: ROOTS,
    description:
      'A buzzing harmonic series that sounds its own major third, over sympathetic strings tuned to C minor.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { attack: 0.5, release: 3, cutoff: 4200, movement: 0.45 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 0, mode: 1, sympathy: 0.8, decay: 7, mix: 0.6 },
      },
    ],
  },
  {
    id: 'undecided-third-octaves-take-no-side',
    name: 'Octaves take no side',
    category: 'drone',
    preview: DAWN,
    description:
      'Octaves only, dark and heavy in the sub, each band rising and sinking on a slow cycle of its own.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { attack: 1.2, release: 2.5, cutoff: 900, movement: 0.5 },
    },
    effects: [
      {
        deviceId: 'currents',
        preset: 'Slow water',
        params: { depth: 0.75, rate: 0.14, sway: 0.7 },
      },
    ],
  },
  {
    id: 'undecided-third-major-shape-minor-air',
    name: 'Major shape, minor air',
    category: 'drone',
    preview: OWN_THIRD,
    description:
      'A just major chord on each key with air in it, behind a filter that leans on the notes of a C minor triad.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { attack: 1, release: 3, air: 0.6, sub: 0, movement: 0.3 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Minor triad',
        params: { root: 0, scale: 1, chord: 1, ring: 1.5, depth: 20, mix: 0.7 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'undecided-third-minor-that-brightens',
    name: 'Minor that brightens',
    category: 'drone',
    preview: EXTREMES,
    description:
      'Glassy octaves on each key, their tail read back through grains that climb in octaves as they ring.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: { shape: 1, attack: 0.9, release: 2.5, cutoff: 7000 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Octave halo',
        params: { mix: 0.45, decay: 9, season: 0 },
      },
    ],
  },
  {
    id: 'undecided-third-both-ears-disagree',
    name: 'Both ears disagree',
    category: 'drone',
    preview: SWAP,
    description:
      'A soft unison saw swarm with a copy a quarter of a semitone sharp on the left and as much flat on the right.',
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: { attack: 0.6, release: 2, cutoff: 1500, movement: 0.35, rate: 0.2 },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        preset: 'Wider',
        params: { detune: 25, mix: 0.6, tone: 5000, drift: 0.4 },
      },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'undecided-third-air-around-the-frame',
    name: 'Air around the frame',
    category: 'texture',
    preview: DAWN,
    description:
      'Tuned wind with barely a tone under it, its level and its brightness breathing in and out on a slow cycle.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { attack: 0.8, release: 3, partials: 0.12, movement: 0.6, cutoff: 6000 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Long slow sigh',
        params: { depth: 0.55, colour: 0.7, air: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-two-keys-of-hum',
    name: 'Two keys of hum',
    category: 'drone',
    preview: LOW_FRAME,
    description:
      'A low sine hum with little above it, pushed through a valve stage until its overtones show, part of it in a cistern.',
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { attack: 1, release: 3, cutoff: 420, partials: 0.35, movement: 0.4, rate: 0.12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6, tone: 0.3 } },
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-harmonic-five-whistles',
    name: 'Harmonic five whistles',
    category: 'drone',
    preview: ROOTS,
    description:
      'A still harmonic series with a resonance held on the fifth harmonic of C, a pure major third that will not leave.',
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: { attack: 0.5, release: 2, cutoff: 5000, wave: 0.2 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'One held note',
        params: { root: 0, pattern: 5, low: 5, high: 5, octave: 2, focus: 0.75, drone: 0.7 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'undecided-third-shimmer-on-the-fence',
    name: 'Shimmer on the fence',
    category: 'pad',
    preview: CROSSING,
    description:
      'Bright octaves moving more than once a second, every band with its own small tremolo so the beats catch light.',
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { attack: 0.7, release: 3, cutoff: 8000, sub: 0.2 },
    },
    effects: [
      {
        deviceId: 'glimmer',
        preset: 'Light on water',
        params: { depth: 0.8, rate: 2.4, lean: 0.3 },
      },
    ],
  },
  {
    id: 'undecided-third-standing-wave-waits',
    name: 'Standing wave waits',
    category: 'drone',
    preview: EXTREMES,
    description:
      'A motionless mono harmonic stack under a nearly still deep phaser, so the only drift is in its notches.',
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { volume: -6.5, attack: 0.6, release: 1.8, cutoff: 2200 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Glacial sweep',
        params: { rate: 0.08, depth: 85, stages: 3, feedback: 55, mix: 0.5 },
      },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },

  // Horns: a frame held like a wall and one player who cannot find the note inside it.
  {
    id: 'undecided-third-horn-in-the-doorframe',
    name: 'Horn in the doorframe',
    category: 'wind',
    preview: HORN_INSIDE,
    description:
      'A soft horn section swelling over a second in a dark hall, with no vibrato at all.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.9, release: 2.2, blow: 0.5, vibrato: 0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } }],
  },
  {
    id: 'undecided-third-flugel-asks-softly',
    name: 'Flugel asks softly',
    category: 'wind',
    preview: NEUTRAL_HIGH,
    description:
      'One breathy flugelhorn that begins each note straight and sways wider the longer it is held.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.35, vibrato: 0, breath: 0.6, release: 1.8 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Wide drone',
        params: { wait: 500, grow: 1500, depth: 45, rate: 2.4, width: 0.7 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'undecided-third-low-brass-abstains',
    name: 'Low brass abstains',
    category: 'wind',
    preview: SWAP,
    description:
      'A low brass choir, slow to open, with a pedal rank of pipes an octave under what it plays.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 1.4, release: 3, blow: 0.5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Pedal under',
        params: { sub: 0.8, octave: 0, twelfth: 0, fifteenth: 0, mix: 0.7 },
      },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.45 } },
    ],
  },
  {
    id: 'undecided-third-mute-turned-halfway',
    name: 'Mute turned halfway',
    category: 'wind',
    preview: NEUTRAL_HIGH,
    description:
      'One muted trumpet heard through a swept notch, with short dark echoes whose two sides waver apart.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.15, release: 1.4, blow: 0.4 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.2 } },
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 290, feedback: 0.4, tone: 1800, spread: 1, mix: 0.35 },
      },
    ],
  },
  {
    id: 'undecided-third-band-across-the-lake',
    name: 'Band across the lake',
    category: 'wind',
    preview: BRASS_HIGH,
    description:
      'A trumpet section with a full blow, carried away over water by distance and bent as it wanders nearer.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.5, blow: 0.6, release: 1.6 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Far shore',
        params: { distance: 0.7, wander: 0.8, rate: 0.2, doppler: 1, level: 1 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'undecided-third-lone-horn-unsure',
    name: 'Lone horn unsure',
    category: 'wind',
    preview: NEUTRAL,
    description:
      'A single horn with slow pitch vibrato at half a cycle a second, answered by one far reflection.',
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.3, release: 1.6, vibrato: 0, blow: 0.5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Pitch wobble',
        params: { mode: 3, rate: 0.5, depth: 0.4, drift: 0.5 },
      },
      { deviceId: 'constellation', preset: 'One far star', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-fourths-lean-inward',
    name: 'Fourths lean inward',
    category: 'wind',
    preview: NEUTRAL_HIGH,
    description:
      'Horns shadowed by a parallel voice below each note, blurred into a half second bank with no tail.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { attack: 0.6, release: 2.4, blow: 0.35 },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank', params: { size: 500, mix: 0.8 } }],
  },
  {
    id: 'undecided-third-mutes-in-a-ring',
    name: 'Mutes in a ring',
    category: 'pad',
    preview: BRASS_HIGH,
    description:
      'A section of muted trumpets turned into a small flock that circles the listener, each a little bent in pitch.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: -8, attack: 1.3, release: 5, blow: 0.15, breath: 0.55 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        preset: 'Wheeling',
        params: { birds: 9, mix: 0.8, speed: 0.7, range: 14 },
      },
    ],
  },
  {
    id: 'undecided-third-soft-brass-on-tape',
    name: 'Soft brass on tape',
    category: 'pad',
    preview: SWAP,
    description:
      'A flugelhorn section on a slow worn reel whose wow pulls the pitch about, with the hiss turned down.',
    instrument: { deviceId: 'horns', preset: 'Flugel choir', params: { attack: 0.6, release: 2 } },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Seasick',
        params: { wow: 0.75, flutter: 0.1, hiss: 0.05, speed: 2 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'undecided-third-mostly-breath-some-horn',
    name: 'Mostly breath, some horn',
    category: 'texture',
    preview: DAWN,
    description:
      'A horn of nearly all air with the quiet overtones inside it turned up, in a reverb that swells after each note.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.5, release: 2, blow: 0.2, breath: 0.85 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.7 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4, time: 2.4 } },
    ],
  },
  {
    id: 'undecided-third-glacier-with-one-crack',
    name: 'Glacier with one crack',
    category: 'pad',
    preview: HORN_INSIDE,
    description:
      'A large loud horn section that still speaks in two seconds, pressed by a slow compressor and left eight seconds to let go.',
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 1.8, release: 8, vibrato: 0, blow: 0.75 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'chorus', preset: 'Slow drift', params: { depth: 45, mix: 0.4 } },
    ],
  },

  // Aurora: two layers of saw and pulse, the frame as a wash and the third as light on it.
  {
    id: 'undecided-third-first-light-unpicked',
    name: 'First light, unpicked',
    category: 'pad',
    preview: DAWN,
    description: 'A dark brass pad that keeps opening while held, let into a long dim plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { attack: 0.7, release: 3, swell: 1, detune: 6 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.85, mix: 0.4 } },
    ],
  },
  {
    id: 'undecided-third-blunt-brass-question',
    name: 'Blunt brass question',
    category: 'keys',
    preview: DOORS,
    description:
      'Short brass stabs with no swell, repeated by a tape of three heads that dulls them.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { attack: 0.08, release: 0.9, contour: 0.8 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 520, feedback: 0.4, mix: 0.4, highCut: 2600 },
      },
    ],
  },
  {
    id: 'undecided-third-ring-of-neither',
    name: 'Ring of neither',
    category: 'bell',
    preview: SEVENTHS,
    description:
      'Ringed chiming strings that start at once, with four long strings tuned to C minor sounding after them.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { release: 3, brilliance: 3600, ring: 0.8 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Centre drone', params: { root: 0, mix: 0.45 } }],
  },
  {
    id: 'undecided-third-loose-in-the-joint',
    name: 'Loose in the joint',
    category: 'pad',
    preview: SWAP,
    description:
      'Reedy layers tuned twenty six cents apart, so every third is already two, through a faint warm overload.',
    instrument: { deviceId: 'aurora', preset: 'Loose reeds', params: { attack: 0.4, release: 2 } },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'undecided-third-pipes-that-wont-say',
    name: "Pipes that won't say",
    category: 'organ',
    preview: DOORS,
    description:
      'Plain undetuned pipes with no envelope on the filter, swaying in pitch, joined late by organ ranks a fifth up and an octave under.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { release: 2.6, brilliance: 650, attack: 0.5, resonance: 0.35, lowCut: 160 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.75, speak: 400 } },
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { mode: 3, rate: 0.3, depth: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'undecided-third-silver-doubt',
    name: 'Silver doubt',
    category: 'string',
    preview: SEVENTHS,
    description:
      'Thin bright strings with their lows cut, each band of them delayed by a different time from low to high.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.6, release: 2.5, lowCut: 600 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.45 } }],
  },
  {
    id: 'undecided-third-vowel-half-open',
    name: 'Vowel, half open',
    category: 'pad',
    preview: DUSK,
    description:
      'A resonant pad whose filter opens like a mouth, inside a hall that sings back on a moving vowel.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.7, release: 2.5, resonance: 0.6, contour: 0.8 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { mix: 0.45, decay: 7 } }],
  },
  {
    id: 'undecided-third-metal-cooling-slowly',
    name: 'Metal cooling slowly',
    category: 'texture',
    preview: EXTREMES,
    description:
      'Ring modulated brass caught in falling grains that slide about seventy cents down, as far as major is from minor.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Melting metal',
      params: { attack: 0.5, release: 4, ring: 0.6 },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Wilting',
        params: { fall: -0.7, size: 1400, density: 6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'undecided-third-deep-swell-no-verdict',
    name: 'Deep swell, no verdict',
    category: 'drone',
    preview: SWAP,
    description:
      'The darkest pad, quickened to a second and a half, with a half speed copy running an octave under it.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { volume: -8.5, attack: 1.5, release: 5, brilliance: 450 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
    ],
  },
  {
    id: 'undecided-third-between-two-phases',
    name: 'Between two phases',
    category: 'pad',
    preview: DUSK,
    description:
      'Open strings almost in tune with themselves, thinned below, moved by a slow flanger with negative feedback across a wide top.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow phasing',
      params: {
        volume: -4.5,
        attack: 1.2,
        release: 1.6,
        brilliance: 2200,
        lowCut: 320,
        swell: 0.1,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.1, mix: 0.5 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'undecided-third-voted-through-the-wall',
    name: 'Voted through the wall',
    category: 'wind',
    preview: NEUTRAL,
    description:
      'A nasal resonant brass lead on a small transistor radio whose signal fades out and back as it plays.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { volume: 0.5, attack: 0.25, release: 1.4, resonance: 0.6 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Clean transistor',
        params: { static: 0.06, fading: 0.6, interference: 0, mix: 0.85 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // Flock: voices that arrive by gliding, so the third is never where it was called.
  {
    id: 'undecided-third-flock-over-the-fence',
    name: 'Flock over the fence',
    category: 'pad',
    preview: DAWN,
    description:
      'Eight birds that fly up into each note over a second and stray there, with no octaves, spread wide.',
    instrument: {
      deviceId: 'flock',
      preset: 'Evening flock',
      params: { birds: 8, gather: 0.9, octaves: 0, stray: 0.4, leave: 1.8 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'undecided-third-one-whistler-wavering',
    name: 'One whistler, wavering',
    category: 'wind',
    preview: FLUTE_LINE,
    description:
      'A single pure whistle to each key with a slow flutter in its pitch, in an open valley of reverb.',
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { gather: 0.3, stray: 0.25, flutter: 1.2, leave: 0.9 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } }],
  },
  {
    id: 'undecided-third-reeds-around-the-note',
    name: 'Reeds around the note',
    category: 'wind',
    preview: SWAP,
    description:
      'Reed-toned voices closing on each note from above and below at once, pressed into a boxy wooden body.',
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { stray: 0.35, gather: 0.7, leave: 1.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'undecided-third-falls-into-place-late',
    name: 'Falls into place, late',
    category: 'pad',
    preview: DUSK,
    description:
      'Voices that drop onto every note from above over a second and a half, with a backwards copy folding in after them.',
    instrument: { deviceId: 'flock', preset: 'Falling in', params: { gather: 1.6, leave: 2 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.45 } }],
  },
  {
    id: 'undecided-third-nervous-in-the-middle',
    name: 'Nervous in the middle',
    category: 'texture',
    preview: EXTREMES,
    description:
      'Seven jittery voices fluttering six times a second, softened into a slow smear of the whole spectrum.',
    instrument: {
      deviceId: 'flock',
      preset: 'Nervous swarm',
      params: { volume: -13.5, leave: 1.5, stray: 0.45 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.6 } }],
  },
  {
    id: 'undecided-third-low-wings-turn-over',
    name: 'Low wings turn over',
    category: 'drone',
    preview: LOW_FRAME,
    description:
      'A dark low murmur gathering over two seconds, under water with the bubbles off and the sides closing in.',
    instrument: { deviceId: 'flock', preset: 'Low murmur', params: { gather: 1.8, leave: 3 } },
    effects: [{ deviceId: 'underwater', preset: 'Under', params: { bubbles: 0, depth: 0.5 } }],
  },
  {
    id: 'undecided-third-pair-that-never-agree',
    name: 'Pair that never agree',
    category: 'wind',
    preview: CROSSING,
    description:
      'Two hollow voices on each key, one to each side, dry but for a light drive and a small room.',
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { volume: -12, stray: 0.4, flutter: 0.3, gather: 0.4, leave: 0.9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'undecided-third-calls-from-both-banks',
    name: 'Calls from both banks',
    category: 'texture',
    preview: SEVENTH_FALL,
    description:
      'Chirping dawn voices in two octaves, scattered into a field of small later echoes.',
    instrument: {
      deviceId: 'flock',
      preset: 'Dawn calls',
      params: { chirp: 0.6, leave: 1.6, gather: 0.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.5, span: 3200 } },
    ],
  },
  {
    id: 'undecided-third-glass-wings-at-noon',
    name: 'Glass wings at noon',
    category: 'texture',
    preview: SEVENTHS,
    description:
      'Pure quick-fluttering voices with their octaves, thrown up into sparse sparks an octave higher.',
    instrument: { deviceId: 'flock', preset: 'Glass swarm', params: { gather: 0.4, leave: 1.8 } },
    effects: [
      { deviceId: 'glints', preset: 'First light', params: { pitch: 0, mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'undecided-third-doubt-arrives-slowly',
    name: 'Doubt arrives slowly',
    category: 'pad',
    preview: LOW_FRAME,
    description:
      'Eight voices that need three seconds to gather, the quiet end of them lifted so every stray is heard.',
    instrument: {
      deviceId: 'flock',
      preset: 'Slow arrival',
      params: { volume: -24.5, gather: 3, leave: 4, stray: 0.55, tone: 0.5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Slow tide', params: { amount: 0.8 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'undecided-third-exact-for-once',
    name: 'Exact, for once',
    category: 'pad',
    preview: NEUTRAL,
    description:
      'Four birds with no stray at all in a clean unison, and a harmonic tremolo the only thing in motion.',
    instrument: { deviceId: 'flock', preset: 'Clean unison', params: { gather: 0.35, leave: 1 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { mode: 2, rate: 3, depth: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },

  // Bowed string: double stops, the fifth on the open strings and one finger rolling.
  {
    id: 'undecided-third-finger-rolls-back',
    name: 'Finger rolls back',
    category: 'string',
    preview: TENTH,
    description:
      'A dark bowed string in a body made larger, its vibrato broad and slow, in a tight chamber.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.7,
        release: 2,
        brightness: 0.2,
        vibrato: 0.6,
        vibratoRate: 3.4,
        position: 0.2,
        body: 1,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.55 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-flautando-on-the-line',
    name: 'Flautando on the line',
    category: 'string',
    preview: TENTH,
    description:
      'A bow with no weight over the fingerboard, the air of it spread wide and its tones left to ring.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air', params: { hold: 0.5 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'undecided-third-rosin-argues',
    name: 'Rosin argues',
    category: 'string',
    preview: DUSK,
    description:
      'A hard pressed bow close to the bridge, tamed where it rings out and darkened by an amplifier.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { volume: -15.5, attack: 0.5, release: 1.5, pressure: 0.8, brightness: 0.6 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Harsh sample' },
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { drive: 0.2, noise: 0 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'undecided-third-glass-bow-tilts',
    name: 'Glass bow tilts',
    category: 'string',
    preview: SEVENTHS,
    description:
      'A light bright bow made slightly smaller in body, its pitch wandering a few cents off and back.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.7, release: 2.5, detune: 4 },
    },
    effects: [
      {
        deviceId: 'size',
        preset: 'Wobble',
        params: { size: -0.3, wander: 0.5, rate: 0.15, mix: 0.7 },
      },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-feedback-finds-the-fifth',
    name: 'Feedback finds the fifth',
    category: 'texture',
    preview: DAWN,
    description:
      'A dull string held by a hard sustainer, fed back through a room until an overtone of the note takes over.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 1.1, release: 3.5, pressure: 0.95, brightness: 0.3, detune: 3 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.65 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'undecided-third-felt-string-hesitates',
    name: 'Felt string hesitates',
    category: 'plucked',
    preview: DOORS,
    description:
      'A soft plucked string with a little skipping echo after it, each bounce closer to the last.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { volume: -4.5, decay: 8, release: 2.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'undecided-third-wire-left-open',
    name: 'Wire left open',
    category: 'plucked',
    preview: DAWN,
    description:
      'A bright wire pluck with a long decay, and a minor bank of strings on A that rings against it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -13.5, decay: 18, release: 4, brightness: 0.65 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { root: 9, mode: 1, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'undecided-third-beating-pair-below',
    name: 'Beating pair below',
    category: 'plucked',
    preview: SLACK,
    description:
      'Plucked strings in pairs twenty five cents apart, their fading ends drawn out into a slow stretched cloud.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { brightness: 0.4, release: 5 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.45 } }],
  },
  {
    id: 'undecided-third-nearly-a-sine',
    name: 'Nearly a sine',
    category: 'pad',
    preview: NEUTRAL,
    description:
      'The plainest sustained string, close to a sine, swelled in and shadowed by its own pure partials an octave up.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.9, release: 2.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-section-out-of-true',
    name: 'Section out of true',
    category: 'string',
    preview: DUSK,
    description:
      'A detuned bowed section with a slow deep vibrato, replayed from a tape loop that crosses to the other side.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.6, release: 2 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Crossing sides',
        params: { length: 1.5, feedback: 0.35, mix: 0.4 },
      },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },

  // Flute: two held tones and a breath between them that settles nowhere.
  {
    id: 'undecided-third-breath-between-the-two',
    name: 'Breath between the two',
    category: 'wind',
    preview: FLUTE_LINE,
    description:
      'A low flute that is mostly breath, slow to begin, in a long reverb whose tail sinks by fifths.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.4, release: 1.8, breath: 0.7 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.4, decay: 9 } },
    ],
  },
  {
    id: 'undecided-third-scooped-up-into-doubt',
    name: 'Scooped up into doubt',
    category: 'wind',
    preview: FLUTE_LINE,
    description:
      'A hard breathed bamboo flute that bends every note up two hundred cents from below, with a pair of echoes set wide.',
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { attack: 0.08, release: 1.4, blow: 0.6 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'undecided-third-pan-pipe-at-the-hinge',
    name: 'Pan pipe at the hinge',
    category: 'wind',
    preview: FLUTE_LINE,
    description:
      'Pan pipes with their chiff left on, blown into a large bottle that hoots along with them.',
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { chiff: 0.7, release: 0.9 } },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { size: 2, mix: 0.65 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'undecided-third-recorder-straight-face',
    name: 'Recorder, straight face',
    category: 'wind',
    preview: SEVENTH_FALL,
    description:
      'A soft recorder with no vibrato and almost no breath, followed by a round of itself: level, an octave up, an octave down.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.2, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: { gap: 2.2, interval2: 12, mix: 0.45 },
      },
    ],
  },
  {
    id: 'undecided-third-wide-bamboo-hesitation',
    name: 'Wide bamboo hesitation',
    category: 'wind',
    preview: FLUTE_LINE,
    description:
      'A bamboo flute near its widest vibrato, its starts blurred by mist and the whole of it set far off.',
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.35, release: 1.6 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.7 } },
      { deviceId: 'distance', preset: 'Through fog', params: { level: 1 } },
    ],
  },
  {
    id: 'undecided-third-hollow-pipes-suspended',
    name: 'Hollow pipes suspended',
    category: 'pad',
    preview: SEVENTH_FALL,
    description:
      'Breathy pan pipes as a pad, every note grown into a string section that arrives after it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.6, release: 2.2 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.5 } }],
  },
  {
    id: 'undecided-third-full-breath-half-answer',
    name: 'Full breath, half answer',
    category: 'wind',
    preview: FLUTE_LINE,
    description:
      'A hard blown concert flute with a quick start, on cassette and through a swept phaser of six stages.',
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { attack: 0.05, release: 0.8, vibrato: 0.2, chiff: 0.4 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.05 } },
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'undecided-third-whisper-over-a-fifth',
    name: 'Whisper over a fifth',
    category: 'texture',
    preview: SEVENTH_FALL,
    description:
      'Pipes that are nearly all air, let through mostly where the notes of the C major scale lie, in a cathedral.',
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.4, release: 1.8 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Wide and gentle',
        params: { root: 0, scale: 0, chord: 0, width: 90, depth: 26, ring: 0.8 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-alto-leans-on-the-beam',
    name: 'Alto leans on the beam',
    category: 'wind',
    preview: FLUTE_LINE,
    description:
      'A full alto flute with a strong vibrato, sent round the listener on a slow circle.',
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { attack: 0.15, release: 1.4, blow: 0.65 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.18, near: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },

  // Reed organ: pressed frame, one key taken up and put down.
  {
    id: 'undecided-third-harmonium-keeps-both',
    name: 'Harmonium keeps both',
    category: 'organ',
    preview: DOORS,
    description:
      'A plain harmonium with a deeper bellows, its chord caught and left sounding under the next one.',
    instrument: { deviceId: 'organ', preset: 'Harmonium', params: { bellows: 0.6, release: 0.8 } },
    effects: [{ deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.45, decay: 6 } }],
  },
  {
    id: 'undecided-third-rank-with-no-third-in-it',
    name: 'Rank with no third in it',
    category: 'organ',
    preview: DAWN,
    description:
      'A plain rank with only a loud twelfth drawn over it, the fifth of each key ringing on in bowls set to C and G.',
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { attack: 0.25, release: 1.2 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 0, scale: 4, mix: 0.4 } }],
  },
  {
    id: 'undecided-third-celeste-pulls-both-ways',
    name: 'Celeste pulls both ways',
    category: 'organ',
    preview: SWAP,
    description:
      'A plain flute rank with a sharp one drawn full against it, beating across the sides of a slow rotating horn.',
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { volume: -15, attack: 0.3, release: 1.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend', params: { speed: 0 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'undecided-third-bellows-change-sides',
    name: 'Bellows change sides',
    category: 'organ',
    preview: DUSK,
    description:
      'A pump organ at full bellows swaying in level, coloured like a dark box and evened by a slow compressor.',
    instrument: { deviceId: 'organ', preset: 'Pump organ', params: { bellows: 1, release: 0.9 } },
    effects: [
      { deviceId: 'imprint', preset: 'Dark box', params: { amount: 1.2 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'undecided-third-voice-stop-at-evening',
    name: 'Voice stop at evening',
    category: 'organ',
    preview: NEUTRAL,
    description:
      'A trembling reed stop kept dark, repeated backwards behind itself in overlapping pieces.',
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.7, attack: 0.3, release: 1.6 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.4, time: 1300 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'undecided-third-squeezebox-on-the-fence',
    name: 'Squeezebox on the fence',
    category: 'organ',
    preview: DOORS,
    description:
      'A bright wheezing accordion, quick on and off, on a small bedside speaker in a long spring tank.',
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { volume: -15.5, tone: 4200, release: 0.3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-pedal-that-outlasts-it',
    name: 'Pedal that outlasts it',
    category: 'drone',
    preview: LOW_FRAME,
    description:
      'A deep pedal rank with a hint of reed, in a dark reverb whose tail keeps sinking, warmed through a transformer.',
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { reed: 0.35, tone: 1100, attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'spiral', preset: 'Deep below', params: { mix: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'undecided-third-service-next-door',
    name: 'Service next door',
    category: 'organ',
    preview: DAWN,
    description:
      'An organ heard through a wall, its highs shut out and the quieter parts of its low body turned back up.',
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { tone: 520, release: 2 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Warm body', params: { amount: 0.6 } },
      { deviceId: 'distance', preset: 'Next door' },
    ],
  },
  {
    id: 'undecided-third-all-stops-no-conclusion',
    name: 'All stops, no conclusion',
    category: 'organ',
    preview: SEVENTHS,
    description:
      'Every rank drawn and bright, opening over a second, in a swarm of echoes the size of a cavern.',
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { volume: -14, attack: 1, release: 2.5 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35 } }],
  },

  // Clarinet: a solo reed, the neutral third its home note.
  {
    id: 'undecided-third-reed-at-eleven-to-nine',
    name: 'Reed at eleven to nine',
    category: 'wind',
    preview: NEUTRAL,
    description:
      'A double reed colour with a generous vibrato, close by, with a large dark cave answering under it.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 0.25, release: 1, vibrato: 0.7, breath: 0.65 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
  },
  {
    id: 'undecided-third-subtone-undeclared',
    name: 'Subtone, undeclared',
    category: 'wind',
    preview: DUSK,
    description:
      'A breathy tenor subtone on a warped record that moves the pitch as it turns, in an airy hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { attack: 0.5, release: 2.2, blow: 0.4, breath: 0.6, vibrato: 0, bore: 0.8 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.06, pops: 0, surface: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'undecided-third-out-of-nothing-to-five',
    name: 'Out of nothing, to five',
    category: 'wind',
    preview: DOORS,
    description:
      'A clarinet that comes out of silence in under a second, shadowed by a soft octave from organ pipes.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 0.8, release: 2 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'undecided-third-low-bore-long-patience',
    name: 'Low bore, long patience',
    category: 'wind',
    preview: TENTH,
    description:
      'A bass clarinet whose held notes wait most of a second before they begin to sway, with a murky late echo.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.35, release: 1.2, blow: 0.6 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Long patience',
        params: { wait: 800, grow: 900, depth: 40 },
      },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'undecided-third-growl-on-the-threshold',
    name: 'Growl on the threshold',
    category: 'texture',
    preview: SWAP,
    description: 'A reed at full growl with the roughness smeared, half of it sunk under water.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { volume: 2, attack: 0.6, release: 2, growl: 0.8 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Half in', params: { bubbles: 0 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'undecided-third-hummed-into-the-sleeve',
    name: 'Hummed into the sleeve',
    category: 'wind',
    preview: CROSSING,
    description: 'A reed blown so softly it only hums, a detuned copy of it on each side.',
    instrument: { deviceId: 'clarinet', preset: 'Reed hum', params: { attack: 0.4, release: 1.5 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.5 } },
      { deviceId: 'lift', preset: 'Warm floor' },
    ],
  },
  {
    id: 'undecided-third-alto-sax-all-sway',
    name: 'Alto sax, all sway',
    category: 'wind',
    preview: NEUTRAL,
    description:
      'An alto saxophone colour with a strong vibrato, two tape heads galloping after it and a bright hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { release: 1.1, attack: 0.18 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'undecided-third-widest-sway-of-all',
    name: 'Widest sway of all',
    category: 'wind',
    preview: NEUTRAL,
    description:
      'A reed with its vibrato at the top, each band of the sound swelling and crossing on its own cycle.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { attack: 0.4, release: 1.8 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Side to side', params: { depth: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'undecided-third-tenor-left-unresolved',
    name: 'Tenor left unresolved',
    category: 'wind',
    preview: DUSK,
    description:
      'A bright tenor swell trimmed to a second, shifted a fraction of a hertz so its partials turn slowly.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 1, release: 2.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 0.3, mix: 0.45 } },
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.4 } },
    ],
  },

  // Choir: everyone holds the fifth, some sing one third and some the other.
  {
    id: 'undecided-third-altos-cannot-agree',
    name: 'Altos cannot agree',
    category: 'voice',
    preview: CROSSING,
    description: 'Altos on an eh, in a small chapel whose short reverb sings with them.',
    instrument: { deviceId: 'choir', preset: 'Altos eh', params: { release: 1.6, attack: 0.5 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.35 } }],
  },
  {
    id: 'undecided-third-monks-beside-the-bowls',
    name: 'Monks beside the bowls',
    category: 'voice',
    preview: DUSK,
    description:
      'Straight-toned low voices with bright bowls tuned to A and E struck by every note they start.',
    instrument: { deviceId: 'choir', preset: 'Low monks', params: { attack: 0.8, release: 2.5 } },
    effects: [
      { deviceId: 'bowls', preset: 'Every attack', params: { root: 9, scale: 4, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'undecided-third-soprano-between-sharps',
    name: 'Soprano between sharps',
    category: 'voice',
    preview: FLUTE_LINE,
    description:
      'One soprano with a deep vibrato and no section around her, heard down a dark narrow tunnel.',
    instrument: { deviceId: 'choir', preset: 'Soloist', params: { release: 1.2, attack: 0.2 } },
    effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.4 } }],
  },
  {
    id: 'undecided-third-hum-behind-the-curtain',
    name: 'Hum behind the curtain',
    category: 'voice',
    preview: DAWN,
    description:
      'Closed-mouth humming replaced by its own octaves, one below and two above, that swell in late and beat.',
    instrument: { deviceId: 'choir', preset: 'Humming', params: { tone: 1000, release: 2 } },
    effects: [
      { deviceId: 'octaves', preset: 'Swell pad' },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'undecided-third-only-breath-votes',
    name: 'Only breath votes',
    category: 'texture',
    preview: EXTREMES,
    description:
      'Voices that are mostly air on a darker vowel, doubled by long grains scattered a little sharp and flat, the lows thinned.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 1.2, release: 4, vowel: 0.6, voice: 0.95, breath: 0.8 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Detuned double', params: { mix: 0.7, size: 400 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'undecided-third-vowel-on-a-slow-hinge',
    name: 'Vowel on a slow hinge',
    category: 'voice',
    preview: DAWN,
    description:
      'A section whose vowel never stops moving, with tape bending the whole choir off its pitch and back.',
    instrument: { deviceId: 'choir', preset: 'Slow vowels', params: { attack: 0.7, release: 2.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus', params: { hiss: 0.05 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'undecided-third-waver-at-the-loft-rail',
    name: 'Waver at the loft rail',
    category: 'voice',
    preview: SEVENTHS,
    description:
      'A few voices with a vibrato of forty cents three times a second, in a reverb that pulses as if breathing.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { volume: -4.5, attack: 0.5, release: 1.6 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'undecided-third-trebles-at-loose-ends',
    name: 'Trebles at loose ends',
    category: 'voice',
    preview: SEVENTH_FALL,
    description:
      'Small high trebles with a restless vowel, caught in slow loops of themselves at octave speeds.',
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { volume: -6, release: 2 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.4 } }],
  },
]
