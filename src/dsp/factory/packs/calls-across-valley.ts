import { type FactoryPreset, type Phrase } from '../types'

// A call and the same call from the far slope: later, softer, duller and a hair flat. Voices come in
// pairs, a near one that is dry and forward and a far one that has crossed the air, and the previews
// are herding calls on the natural harmonics, with the seventh and the eleventh left between the keys.

// The high call on harmonics 12 11 10 9 10 9 8 of C, top note held, no ornament.
const HIGH_CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 79.02, gain: 0.6 },
    { atSec: 1.6, durSec: 0.35, note: 77.51, gain: 0.5 },
    { atSec: 1.95, durSec: 0.4, note: 75.86, gain: 0.5 },
    { atSec: 2.35, durSec: 0.35, note: 74.04, gain: 0.45 },
    { atSec: 2.7, durSec: 1.7, note: 75.86, gain: 0.55 },
    { atSec: 4.4, durSec: 0.45, note: 74.04, gain: 0.45 },
    { atSec: 4.85, durSec: 1.5, note: 72, gain: 0.5 },
  ],
}

// The same call given back: late, soft, six cents flat, its quick steps a little drawn out.
const HIGH_BACK: Phrase = {
  notes: [
    { atSec: 0.6, durSec: 1.4, note: 78.96, gain: 0.36 },
    { atSec: 2, durSec: 0.5, note: 77.45, gain: 0.3 },
    { atSec: 2.5, durSec: 0.55, note: 75.8, gain: 0.3 },
    { atSec: 3.05, durSec: 0.5, note: 73.98, gain: 0.28 },
    { atSec: 3.55, durSec: 1.5, note: 75.8, gain: 0.34 },
    { atSec: 5.05, durSec: 0.6, note: 73.98, gain: 0.28 },
    { atSec: 5.65, durSec: 1.5, note: 71.94, gain: 0.3 },
  ],
}

// The wooden horn on harmonics 4 5 6 7 6 of C: the seventh is 31 cents under B flat.
const HORN_CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 60, gain: 0.6 },
    { atSec: 1.2, durSec: 0.6, note: 63.86, gain: 0.55 },
    { atSec: 1.8, durSec: 1.9, note: 67.02, gain: 0.65 },
    { atSec: 3.7, durSec: 0.6, note: 69.69, gain: 0.5 },
    { atSec: 4.3, durSec: 1.9, note: 67.02, gain: 0.6 },
  ],
}

// The horn given back: late, soft, six cents flat and slower, as a far slope smears it.
const HORN_BACK: Phrase = {
  notes: [
    { atSec: 0.4, durSec: 1.4, note: 59.94, gain: 0.36 },
    { atSec: 1.8, durSec: 0.9, note: 63.8, gain: 0.32 },
    { atSec: 2.7, durSec: 1.9, note: 66.96, gain: 0.38 },
    { atSec: 4.6, durSec: 0.9, note: 69.63, gain: 0.3 },
    { atSec: 5.5, durSec: 1.8, note: 66.96, gain: 0.34 },
  ],
}

// Harmonics 8 9 10 11 10 12 10 8 of G: the eleventh lies between C and C sharp.
const LONG_WOOD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 67, gain: 0.55 },
    { atSec: 0.9, durSec: 0.5, note: 69.04, gain: 0.5 },
    { atSec: 1.4, durSec: 0.5, note: 70.86, gain: 0.5 },
    { atSec: 1.9, durSec: 1.3, note: 72.51, gain: 0.6 },
    { atSec: 3.2, durSec: 0.4, note: 70.86, gain: 0.45 },
    { atSec: 3.6, durSec: 1.2, note: 74.02, gain: 0.6 },
    { atSec: 4.8, durSec: 0.5, note: 70.86, gain: 0.45 },
    { atSec: 5.3, durSec: 1.3, note: 67, gain: 0.5 },
  ],
}

// Harmonics 6 7 6 of C, then the near slope six cents flat, then the far one twelve.
const TWO_SLOPES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 67.02, gain: 0.8 },
    { atSec: 0.7, durSec: 0.35, note: 69.69, gain: 0.7 },
    { atSec: 1.05, durSec: 1, note: 67.02, gain: 0.75 },
    { atSec: 2.5, durSec: 0.7, note: 66.96, gain: 0.38 },
    { atSec: 3.2, durSec: 0.35, note: 69.63, gain: 0.34 },
    { atSec: 3.55, durSec: 1, note: 66.96, gain: 0.36 },
    { atSec: 5, durSec: 0.7, note: 66.9, gain: 0.22 },
    { atSec: 5.7, durSec: 0.35, note: 69.57, gain: 0.2 },
    { atSec: 6.05, durSec: 1, note: 66.9, gain: 0.22 },
  ],
}

// Harmonics 8 9 6 of D and then the gap, kept.
const NO_ANSWER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 74, gain: 0.6 },
    { atSec: 0.9, durSec: 0.35, note: 76.04, gain: 0.5 },
    { atSec: 1.25, durSec: 1.2, note: 69.02, gain: 0.6 },
  ],
}

// The low lure, as if up close: G, the neutral third over D, D.
const LURE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 67, gain: 0.5 },
    { atSec: 1.1, durSec: 0.7, note: 65.5, gain: 0.45 },
    { atSec: 1.8, durSec: 1.4, note: 62, gain: 0.5 },
    { atSec: 3.6, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 4.4, durSec: 0.6, note: 65.5, gain: 0.4 },
    { atSec: 5, durSec: 1.5, note: 62, gain: 0.45 },
  ],
}

// A high call in A whose third is the blue one, between minor and major.
const BLUE_CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 76.02, gain: 0.6 },
    { atSec: 1.4, durSec: 0.35, note: 74, gain: 0.5 },
    { atSec: 1.75, durSec: 0.4, note: 72.5, gain: 0.5 },
    { atSec: 2.15, durSec: 0.35, note: 74, gain: 0.45 },
    { atSec: 2.5, durSec: 1.4, note: 72.5, gain: 0.55 },
    { atSec: 3.9, durSec: 0.4, note: 71, gain: 0.45 },
    { atSec: 4.3, durSec: 0.4, note: 72.5, gain: 0.45 },
    { atSec: 4.7, durSec: 1.7, note: 69, gain: 0.5 },
  ],
}

// Two horns on one tube length of C: 5 and 8, 6 and 9, 8 and 10, and back (sixth, fifth, third).
const HORN_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 63.86, gain: 0.5 },
    { atSec: 0, durSec: 1.4, note: 72, gain: 0.55 },
    { atSec: 1.4, durSec: 1, note: 67.02, gain: 0.48 },
    { atSec: 1.4, durSec: 1, note: 74.04, gain: 0.52 },
    { atSec: 2.4, durSec: 2, note: 72, gain: 0.5 },
    { atSec: 2.4, durSec: 2, note: 75.86, gain: 0.55 },
    { atSec: 4.4, durSec: 1, note: 67.02, gain: 0.42 },
    { atSec: 4.4, durSec: 1, note: 74.04, gain: 0.46 },
    { atSec: 5.4, durSec: 1.7, note: 63.86, gain: 0.44 },
    { atSec: 5.4, durSec: 1.7, note: 72, gain: 0.48 },
  ],
}

// Harmonics 2 to 7 of C, entering one by one: the whole valley sounding one tube.
const VALLEY_CHORD: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 48, gain: 0.5 },
    { atSec: 0.5, durSec: 5.9, note: 55.02, gain: 0.45 },
    { atSec: 1, durSec: 5.4, note: 60, gain: 0.42 },
    { atSec: 1.6, durSec: 4.8, note: 63.86, gain: 0.4 },
    { atSec: 2.2, durSec: 4.2, note: 67.02, gain: 0.4 },
    { atSec: 3, durSec: 3.4, note: 69.69, gain: 0.4 },
  ],
}

// Many herders at once on harmonics 5 to 12 of C, nobody waiting for anybody.
const HERD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 79.02, gain: 0.55 },
    { atSec: 0.6, durSec: 0.5, note: 75.86, gain: 0.45 },
    { atSec: 1.2, durSec: 1.2, note: 72, gain: 0.5 },
    { atSec: 1.5, durSec: 0.4, note: 77.51, gain: 0.4 },
    { atSec: 2.4, durSec: 1.5, note: 67.02, gain: 0.5 },
    { atSec: 3, durSec: 0.4, note: 74.04, gain: 0.4 },
    { atSec: 3.5, durSec: 0.35, note: 75.86, gain: 0.4 },
    { atSec: 4, durSec: 1.4, note: 69.69, gain: 0.45 },
    { atSec: 4.6, durSec: 1.6, note: 72, gain: 0.45 },
    { atSec: 4.8, durSec: 1.5, note: 63.86, gain: 0.45 },
  ],
}

// The wooden horn an octave down, 4 5 6 7 6 of C, and the far slope after it: softer and six cents flat.
const LOW_CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 48, gain: 0.6 },
    { atSec: 0.7, durSec: 0.4, note: 51.86, gain: 0.55 },
    { atSec: 1.1, durSec: 1.1, note: 55.02, gain: 0.6 },
    { atSec: 2.2, durSec: 0.4, note: 57.69, gain: 0.5 },
    { atSec: 2.6, durSec: 0.8, note: 55.02, gain: 0.55 },
    { atSec: 3.8, durSec: 0.7, note: 47.94, gain: 0.32 },
    { atSec: 4.5, durSec: 0.4, note: 51.8, gain: 0.28 },
    { atSec: 4.9, durSec: 1.1, note: 54.96, gain: 0.32 },
    { atSec: 6, durSec: 0.4, note: 57.63, gain: 0.27 },
    { atSec: 6.4, durSec: 0.8, note: 54.96, gain: 0.3 },
  ],
}

// Harmonics 4 6 7 6 of C over the ground they belong to, then 6 and 4 given back six cents flat.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.1, note: 36, gain: 0.45 },
    { atSec: 0.4, durSec: 1.2, note: 48, gain: 0.55 },
    { atSec: 1.6, durSec: 1, note: 55.02, gain: 0.5 },
    { atSec: 2.6, durSec: 1, note: 57.69, gain: 0.5 },
    { atSec: 3.6, durSec: 1.4, note: 55.02, gain: 0.5 },
    { atSec: 5.3, durSec: 0.9, note: 54.96, gain: 0.3 },
    { atSec: 6.2, durSec: 1, note: 47.94, gain: 0.3 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Horns: ten pairs, a near voice dry and forward, then the one the far slope gives back.
  {
    id: 'calls-across-valley-bark-horn-at-the-gate',
    name: 'Bark horn at the gate',
    category: 'wind',
    description:
      'One horn blown firmly with a quick start, warmed by a tape preamp, with a little of a small room: the near caller.',
    preview: HORN_CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { blow: 0.75, breath: 0.15, attack: 0.06, release: 0.4, vibrato: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.35, circuit: 0 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'calls-across-valley-bark-horn-over-the-tarn',
    name: 'Bark horn over the tarn',
    category: 'wind',
    description:
      'The same horn barely blown and full of breath, six cents flat and set on a far shore with a long room round it.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: -0.5, blow: 0.18, breath: 0.55, attack: 0.5, release: 2.2, vibrato: 0 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.1, fine: -6 } },
      { deviceId: 'distance', preset: 'Far shore', params: { wander: 0.1 } },
    ],
  },
  {
    id: 'calls-across-valley-birch-tube-up-close',
    name: 'Birch tube up close',
    category: 'wind',
    description:
      'A straight bright trumpet tone through a horn loudspeaker turned a little away, with almost no room.',
    preview: LONG_WOOD,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { blow: 0.6, breath: 0.12, attack: 0.03, release: 0.25, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Clean and bright',
        params: { speaker: 3, drive: 0.2, angle: 0.4, room: 0.15, noise: 0 },
      },
    ],
  },
  {
    id: 'calls-across-valley-birch-tube-sent-back',
    name: 'Birch tube sent back',
    category: 'wind',
    description:
      'A breathy trumpet with its top cut, skipped off two slopes, the second return 9 dB under the first and six cents flat.',
    preview: NO_ANSWER,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { volume: 2.5, blow: 0.15, breath: 0.5, attack: 0.3, release: 1.4, vibrato: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { highCut: 3600 } },
      {
        deviceId: 'skipping-stone',
        preset: 'Two skips',
        params: {
          first: 2000,
          bounce: 1,
          skips: 2,
          loss: 9,
          sink: 0.6,
          drop: 6,
          throw: 0.8,
          mix: 0.35,
        },
      },
    ],
  },
  {
    id: 'calls-across-valley-ram-horn-on-the-wall',
    name: 'Ram horn on the wall',
    category: 'wind',
    description:
      'A muted trumpet with a spit of breath, speaking through a short stopped pipe and over as soon as it is let go.',
    preview: TWO_SLOPES,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: -1, blow: 0.6, breath: 0.4, attack: 0.02, release: 0.2, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { body: 2, size: 0.6, air: 0.35, mix: 0.6 },
      },
    ],
  },
  {
    id: 'calls-across-valley-ram-horn-past-the-rise',
    name: 'Ram horn past the rise',
    category: 'pad',
    description:
      'A section of muted brass rising behind a low-pass filter, with more hall than horn left in it.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: 6, blow: 0.35, attack: 0.6, release: 4 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { type: 0, slope: 1, cutoffHz: 1100 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'calls-across-valley-long-lur-in-the-yard',
    name: 'Long lur in the yard',
    category: 'wind',
    description:
      'Low brass blown hard and straight into a tube stage, heard almost wholly through a long stopped pipe.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { blow: 0.9, vibrato: 0, attack: 0.05, release: 0.2, section: 0.4 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 5, toneDb: -3 } },
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { body: 2, size: 1.6, opening: 0.2, mix: 0.95 },
      },
    ],
  },
  {
    id: 'calls-across-valley-long-lur-down-the-gully',
    name: 'Long lur down the gully',
    category: 'wind',
    description:
      'One soft tuba with a lot of air, broken up in a cavern of short echoes whose size slowly wanders.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { volume: -2, blow: 0.22, breath: 0.5, attack: 0.3, release: 2.5 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Cavern',
        params: { highCut: 2200, wander: 0.25, mix: 0.55 },
      },
    ],
  },
  {
    id: 'calls-across-valley-cow-horn-by-the-churn',
    name: 'Cow horn by the churn',
    category: 'wind',
    description:
      'A solo flugelhorn, breathy and near, thickened by a light chorus and softened by slow tape.',
    preview: LURE,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { volume: 2, blow: 0.45, breath: 0.35, vibrato: 0.1, attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, hiss: 0.1, wow: 0.35 } },
    ],
  },
  {
    id: 'calls-across-valley-cow-horn-after-the-rain',
    name: 'Cow horn after the rain',
    category: 'pad',
    description:
      'A flugelhorn choir left out in slow drips, its murky repeats nearly a second apart.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { volume: 1, blow: 0.25, breath: 0.3, attack: 0.5, release: 2.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow drips', params: { exposure: 0.6, voice: 0.35 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { tone: 1800, mix: 0.35 } },
    ],
  },
  {
    id: 'calls-across-valley-two-horns-at-the-pass',
    name: 'Two horns at the pass',
    category: 'wind',
    description:
      'Horns in parallel fourths with a quick start, in a short burst of room that stops dead.',
    preview: LONG_WOOD,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { volume: -1.5, blow: 0.7, section: 0.2, attack: 0.1, release: 0.4 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.5, mix: 0.35 } }],
  },
  {
    id: 'calls-across-valley-two-horns-past-the-pass',
    name: 'Two horns past the pass',
    category: 'pad',
    description:
      'Flugelhorns in fifths with a tail that sags eight cents a second as it rings, in a wide dim space.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { volume: 2, blow: 0.2, attack: 0.6, release: 4 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9, highCut: 2600, mix: 0.4 } },
    ],
  },
  {
    id: 'calls-across-valley-herd-coming-down',
    name: 'Herd coming down',
    category: 'wind',
    description:
      'A brass section well blown, its held notes starting straight and swaying late, in a bright small chamber.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { volume: -1, attack: 0.2, release: 0.9 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there', params: { depth: 12 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'calls-across-valley-herd-gone-over',
    name: 'Herd gone over',
    category: 'pad',
    description:
      'A section of horns over two seconds in coming, every edge blurred into deep fog and the top taken away.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 2.4, blow: 0.6, vibrato: 0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1800 } },
    ],
  },
  {
    id: 'calls-across-valley-low-horn-under-the-farm',
    name: 'Low horn under the farm',
    category: 'wind',
    description:
      'A low brass choir that starts within half a second and is doubled an octave below, gently levelled.',
    preview: GROUND,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.5, attack: 0.35, release: 1.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35, up1: 0 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'calls-across-valley-low-horn-the-hill-kept',
    name: 'Low horn the hill kept',
    category: 'drone',
    description:
      'A low brass choir caught by a dark sustainer that holds each chord on after it stops and slides to the next.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.3, attack: 1.2, release: 3 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.65 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'calls-across-valley-call-for-two-slopes',
    name: 'Call for two slopes',
    category: 'wind',
    description:
      'A solo horn and a round of two followers, 2.4 seconds apart, the second softer and both with the top off.',
    preview: NO_ANSWER,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: 2, blow: 0.5, breath: 0.2, attack: 0.1, release: 0.7, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { followers: 2, gap: 2.4, fade: 0.6, spread: 1, tone: 1800, mix: 0.4 },
      },
    ],
  },
  {
    id: 'calls-across-valley-the-slope-hums-along',
    name: 'The slope hums along',
    category: 'wind',
    description:
      'A few horns a key, quick to rise, over strings tuned to C major that take up the harmonics they share.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { section: 0.3, attack: 0.25, release: 0.8, breath: 0.2 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 0, mode: 0, decay: 8, sympathy: 0.75, mix: 0.6 },
      },
    ],
  },
  {
    id: 'calls-across-valley-breath-in-the-mouthpiece',
    name: 'Breath in the mouthpiece',
    category: 'texture',
    description:
      'A horn that is nearly all air, its faint overtones raised and a bed of microphone air laid under it.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { volume: -2, attack: 0.3, release: 1.2 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { type: 6, level: -54 } },
    ],
  },
  {
    id: 'calls-across-valley-last-horn-before-snow',
    name: 'Last horn before snow',
    category: 'pad',
    description:
      'A horn section under deep winter: thinned, frozen a little and slowly moving, with a cold tail.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.45, section: 1, attack: 1.4, release: 5 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'Deep winter', params: { turn: 0 } },
      { deviceId: 'stereo-detune', preset: 'Cloud' },
    ],
  },

  // Overtone: the caller's own mouth picks the harmonic; near ones narrow and quick, far ones wide and slow.
  {
    id: 'calls-across-valley-seventh-in-the-teeth',
    name: 'Seventh in the teeth',
    category: 'voice',
    description:
      'A throat holding its seventh harmonic still and close, with a little grit and a light valve warmth.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: {
        overtone: 7,
        focus: 0.9,
        wander: 0,
        growl: 0.3,
        vibrato: 0,
        attack: 0.05,
        release: 0.3,
        width: 0.1,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { drive: 0.3, noise: 0.05 } }],
  },
  {
    id: 'calls-across-valley-seventh-on-the-scree',
    name: 'Seventh on the scree',
    category: 'voice',
    description:
      'The seventh harmonic with its focus loosened and its edges slow, scattered into a long dark field of echoes.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: {
        overtone: 7,
        focus: 0.5,
        wander: 0.1,
        breath: 0.5,
        vibrato: 0,
        attack: 0.7,
        release: 2,
        width: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Dark field',
        params: { span: 5000, tone: 1500, mix: 0.5 },
      },
    ],
  },
  {
    id: 'calls-across-valley-eleventh-held-up',
    name: 'Eleventh held up',
    category: 'voice',
    description:
      'A pipe held on its eleventh harmonic, the note between the keys, pure and dry but for a short ambience.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: {
        volume: -5,
        overtone: 11,
        wander: 0,
        breath: 0.05,
        attack: 0.06,
        release: 0.4,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.15 } },
      {
        deviceId: 'ambient-eq',
        preset: 'Thin',
        params: { lowCut: 150, highCut: 6000, presence: 1 },
      },
    ],
  },
  {
    id: 'calls-across-valley-eleventh-let-down',
    name: 'Eleventh let down',
    category: 'voice',
    description:
      'The eleventh harmonic of an airy pipe, sent off in falling pieces that sink a fifth as they fade.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { volume: -2.5, overtone: 11, wander: 0, breath: 0.6, attack: 0.4, release: 1.2 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs', params: { fall: -7, tone: 2500, mix: 0.45 } },
    ],
  },
  {
    id: 'calls-across-valley-jaw-on-the-doorstep',
    name: 'Jaw on the doorstep',
    category: 'plucked',
    description:
      'A reed plucked and stopped at once, its mouth jumping between harmonics four times a second, on a small speaker.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { volume: -14.5, overtone: 9, release: 0.25, width: 0.2 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { room: 0.2, noise: 0, drive: 0.15 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'calls-across-valley-jaw-from-the-far-hut',
    name: 'Jaw from the far hut',
    category: 'plucked',
    description:
      'The plucked reed slowed to two steps a second, with its own sound behind it backwards and late in dark fog.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: {
        volume: -2,
        overtone: 6,
        pace: 2,
        focus: 0.6,
        attack: 0.04,
        release: 1.2,
        width: 0.7,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { time: 1400, mix: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'calls-across-valley-growl-at-the-fold',
    name: 'Growl at the fold',
    category: 'drone',
    description:
      'A growling throat on its sixth harmonic, close and narrow, its ringing tones held down.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { attack: 0.04, release: 0.5, width: 0.15 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Ringing tones' },
      { deviceId: 'ambient-comp', preset: 'Mic' },
    ],
  },
  {
    id: 'calls-across-valley-growl-underground',
    name: 'Growl underground',
    category: 'drone',
    description:
      'The growl slowed and lowered to the fourth harmonic, gathered in a low drum body under a dark cave of reverb.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: { growl: 0.7, attack: 0.5, release: 2.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 2, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'calls-across-valley-reed-drone-in-the-byre',
    name: 'Reed drone in the byre',
    category: 'drone',
    description:
      'A buzzing reed drone inside a wooden body, its ninth harmonic drifting a little above.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { attack: 0.15, release: 0.8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.65 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'calls-across-valley-reed-drone-in-heat-haze',
    name: 'Reed drone in heat haze',
    category: 'drone',
    description:
      'The reed drone blown through a soft fuzz and a long reverb with the top rolled back, until it is mostly glow.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { overtone: 5, focus: 0.35, growl: 0, attack: 1.2, release: 4, width: 1 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { tone: 0.2, mix: 0.5 } }],
  },
  {
    id: 'calls-across-valley-steps-down-the-track',
    name: 'Steps down the track',
    category: 'voice',
    description:
      'A throat whose whistle steps three times a second over the harmonics near the tenth, with one quick slap.',
    preview: LOW_CALL,
    instrument: { deviceId: 'overtone', preset: 'Quick steps', params: { width: 0.4 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { time: 120, drive: 0.2 } }],
  },
  {
    id: 'calls-across-valley-steps-on-the-far-track',
    name: 'Steps on the far track',
    category: 'voice',
    description:
      'The stepping whistle at a walking pace, blurred over by repeats a second and a half apart and dulled each time.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: { pace: 1, overtone: 6, focus: 0.7, breath: 0.4, attack: 0.4, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 1500, mix: 0.5, feedback: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'calls-across-valley-vowels-over-the-fence',
    name: 'Vowels over the fence',
    category: 'voice',
    description:
      'A throat with wide open harmonics that keep changing vowel, kept near by a short chamber.',
    preview: LURE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { attack: 0.12, release: 0.8, pace: 0.6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
      { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 0.5 } },
    ],
  },
  {
    id: 'calls-across-valley-vowels-lost-in-wind',
    name: 'Vowels lost in wind',
    category: 'voice',
    description:
      'The open vowels carried off by gusts that raise and dull them, with a thin wind of its own.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { overtone: 4, breath: 0.6, attack: 1, release: 3.5 },
    },
    effects: [
      {
        deviceId: 'weather',
        preset: 'Breezy day',
        params: { exposure: 0.85, force: 0.7, voice: 0.3 },
      },
    ],
  },
  {
    id: 'calls-across-valley-glass-note-at-noon',
    name: 'Glass note at noon',
    category: 'drone',
    description:
      'A reed reduced to its sixteenth harmonic, pure and slow, with sparse trailing sparks an octave higher, warmed below.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { volume: -5, vibrato: 0, attack: 0.3, release: 2.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars', params: { pitch: 0, mix: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'calls-across-valley-still-note-at-nightfall',
    name: 'Still note at nightfall',
    category: 'voice',
    description:
      'A throat on its twelfth harmonic that does not move, copied six cents either way and left in a vast nave.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { breath: 0.2, attack: 0.8, release: 3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { detune: 6, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { damping: 2800, mix: 0.45 } },
    ],
  },
  {
    id: 'calls-across-valley-drone-pipe-and-bellows',
    name: 'Drone pipe and bellows',
    category: 'drone',
    description:
      'A rough drone pipe on its fifth harmonic that opens and closes with a slow breath.',
    preview: GROUND,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { attack: 0.1, release: 0.6, width: 0.3 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 1.4, out: 1.6, hold: 0.2, rest: 0.3, depth: 0.5 },
      },
    ],
  },
  {
    id: 'calls-across-valley-lip-buzz-on-birch-bark',
    name: 'Lip buzz on birch bark',
    category: 'wind',
    description:
      'Lips buzzing raw on a pipe at its third harmonic, pushed through an early sampler with the top closed off.',
    preview: HORN_CALL,
    instrument: { deviceId: 'overtone', preset: 'Lip buzz', params: { release: 0.3, width: 0 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'auto-filter', preset: 'Init', params: { type: 0, cutoffHz: 2600 } },
    ],
  },
  {
    id: 'calls-across-valley-air-over-the-snowline',
    name: 'Air over the snowline',
    category: 'texture',
    description:
      'A whistle made of breath on the twelfth harmonic, its partials fanned out from low to high over two slow seconds.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'overtone',
      preset: 'Air whistle',
      params: { volume: -18.5, overtone: 12, attack: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.5 } },
      { deviceId: 'ambient-limiter', preset: 'Loud' },
    ],
  },
  {
    id: 'calls-across-valley-whole-ridge-sounding',
    name: 'Whole ridge sounding',
    category: 'pad',
    description:
      'A wide held throat chord over which a narrow resonance leaps through harmonics of C, with swaying bands.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'overtone',
      preset: 'Wide chord',
      params: { vibrato: 0.1, attack: 0.6, release: 3 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Bugle call',
        params: { root: 0, octave: 2, focus: 0.4, pace: 1.2 },
      },
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.5 } },
    ],
  },

  // Clarinet: eight reeds near and eight far, from wood to metal bore, from tongue to breath.
  {
    id: 'calls-across-valley-willow-reed-in-hand',
    name: 'Willow reed in hand',
    category: 'wind',
    description:
      'A clarinet reed tongued quickly and blown open, held level and kept dry with a hint of small wood round it.',
    preview: LONG_WOOD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { volume: -0.5, blow: 0.8, vibrato: 0, breath: 0.1, release: 0.15 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { size: 0.8 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'calls-across-valley-willow-reed-returns',
    name: 'Willow reed returns',
    category: 'wind',
    description:
      'A soft airy clarinet that comes in from nothing, returned by two slopes, the second softer, duller and flatter.',
    preview: NO_ANSWER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { volume: 6, blow: 0.35, breath: 0.6, attack: 0.3, release: 1.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room', params: { distance: 0.45 } },
      {
        deviceId: 'skipping-stone',
        preset: 'Two skips',
        params: { first: 1800, bounce: 1.1, skips: 2, loss: 8, sink: 0.5, drop: 6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'calls-across-valley-goat-horn-growled',
    name: 'Goat horn growled',
    category: 'wind',
    description:
      'A wide bore reed growled and short, driven through the horn of a brake-stopped rotating cabinet.',
    preview: TWO_SLOPES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.75, vibrato: 0, release: 0.15 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'calls-across-valley-goat-horn-in-smoke',
    name: 'Goat horn in smoke',
    category: 'wind',
    description:
      'The growl kept but the reed blown low and breathy, set back in a stone stairwell under a blanket of tape.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: {
        volume: 6,
        bore: 0.7,
        blow: 0.15,
        breath: 0.9,
        growl: 0.5,
        vibrato: 0,
        attack: 0.4,
        release: 1.5,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.7, air: 0.8 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'calls-across-valley-apricot-pipe-on-a-bench',
    name: 'Apricot pipe on a bench',
    category: 'wind',
    description:
      'A double reed colour with its vibrato taken off, close to the ear, over a faint string pad that doubles it.',
    preview: BLUE_CALL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { volume: -1.5, vibrato: 0, attack: 0.1, release: 0.35 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.3 } }],
  },
  {
    id: 'calls-across-valley-apricot-pipe-at-the-ford',
    name: 'Apricot pipe at the ford',
    category: 'wind',
    description:
      'The same reed taken just under the water and set swimming between left and right, two seconds of tail on it.',
    preview: BLUE_CALL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { volume: 1.5, bore: 0.2, blow: 0.2, vibrato: 0.15, attack: 0.22, release: 2 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { depth: 0.35 } },
      { deviceId: 'around', preset: 'Gentle sway', params: { rate: 0.15 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { decay: 2, mix: 0.4 } },
    ],
  },
  {
    id: 'calls-across-valley-low-reed-by-the-trough',
    name: 'Low reed by the trough',
    category: 'wind',
    description:
      'A bass clarinet with a firm start, its spectrum fattened at the bottom and nothing after the note.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.65, breath: 0.25, attack: 0.06, release: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'calls-across-valley-low-reed-in-the-corrie',
    name: 'Low reed in the corrie',
    category: 'wind',
    description:
      'A bass clarinet thrown into a dark well of echoes the size of a hillside bowl, more well than reed.',
    preview: GROUND,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { bore: 0.2, blow: 0.3, breath: 0.6, attack: 0.5, release: 1.8 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.65 } },
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -30 } },
    ],
  },
  {
    id: 'calls-across-valley-hum-before-calling',
    name: 'Hum before calling',
    category: 'wind',
    description:
      'A reed hummed more than blown, its strongest tone redrawn as one sine that swells in beside it.',
    preview: LURE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { volume: -2, attack: 0.15, release: 0.5 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'One sine', params: { release: 1.2, mix: 0.45 } }],
  },
  {
    id: 'calls-across-valley-whisper-after-calling',
    name: 'Whisper after calling',
    category: 'texture',
    description:
      'Only the breath of the reed, opened and closed by a slow tide of air and spread wide at the top.',
    preview: HIGH_BACK,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { volume: 3.5, attack: 0.3, release: 1.4 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { in: 1.6, out: 2, air: 0.6 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'calls-across-valley-reed-choir-on-the-steps',
    name: 'Reed choir on the steps',
    category: 'organ',
    description:
      'Hollow reeds with pipes an octave, a twelfth and two octaves above them drawn softly, in a small close room.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.12, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Principal chorus',
        params: { sub: 0.2, octave: 0.2, twelfth: 0.35, fifteenth: 0.3, mix: 0.6 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'calls-across-valley-reed-choir-on-the-ridge',
    name: 'Reed choir on the ridge',
    category: 'pad',
    description:
      'Hollow reeds swelling in and left as a stretched cloud that trails far behind what was played.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { bore: 0.25, blow: 0.4, attack: 0.6, release: 2.5 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.6, tone: -0.3 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
    ],
  },
  {
    id: 'calls-across-valley-tin-reed-at-dawn',
    name: 'Tin reed at dawn',
    category: 'wind',
    description:
      'A bright soprano reed with a lot of breath, heard over the farm wireless with the static nearly gone.',
    preview: HIGH_CALL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.6, vibrato: 0, breath: 0.6, release: 0.6 },
    },
    effects: [{ deviceId: 'radio', preset: 'Clean transistor', params: { static: 0.08 } }],
  },
  {
    id: 'calls-across-valley-tin-reed-at-dusk',
    name: 'Tin reed at dusk',
    category: 'wind',
    description:
      'The soprano reed dimmed and answered four seconds late from an echo with a long memory.',
    preview: NO_ANSWER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { volume: -0.5, blow: 0.12, breath: 0.45, vibrato: 0, attack: 0.25, release: 1 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Late return', params: { tone: 1800, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'calls-across-valley-tongue-fluttered-back',
    name: 'Tongue fluttered back',
    category: 'wind',
    description:
      'A flutter-tongued reed whose returns arrive backwards, each chunk swelling up and cutting off.',
    preview: TWO_SLOPES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.1, release: 0.5, growl: 0.8 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 900, tone: 3000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'calls-across-valley-tenor-reed-in-low-cloud',
    name: 'Tenor reed in low cloud',
    category: 'pad',
    description:
      'A wide tenor reed swelling for over a second while clouds pass over it, in a tail that keeps sliding slowly down.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { blow: 0.5, vibrato: 0, attack: 1.4, release: 4 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Passing clouds', params: { voice: 0.1 } },
      { deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.45 } },
    ],
  },

  // Flute: herders' pipes, eight at the hand and eight on the other side.
  {
    id: 'calls-across-valley-sallow-pipe-in-the-yard',
    name: 'Sallow pipe in the yard',
    category: 'wind',
    description:
      'A wood flute with no vibrato and a hard chiff, blown firmly and almost dry, for playing the steps quickly.',
    preview: HIGH_CALL,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { vibrato: 0, scoop: 0, blow: 0.6, chiff: 0.8, attack: 0.01, release: 0.12 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'calls-across-valley-sallow-pipe-off-the-fell',
    name: 'Sallow pipe off the fell',
    category: 'wind',
    description:
      'A wood flute that is mostly breath with soft edges, six cents flat, seen through fog at the far end of a wide tail.',
    preview: HIGH_BACK,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { blow: 0.3, attack: 0.2, release: 1.8, breath: 0.7, vibrato: 0 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.15, fine: -6 } },
      { deviceId: 'distance', preset: 'Through fog' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'calls-across-valley-straight-at-the-wall',
    name: 'Straight at the wall',
    category: 'wind',
    description:
      'A concert flute with neither vibrato nor scoop against a single hard slap a tenth of a second behind.',
    preview: HIGH_CALL,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.06, release: 0.3, blow: 0.8 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slapback', params: { time: 110, mix: 0.35 } }],
  },
  {
    id: 'calls-across-valley-straight-off-the-crag',
    name: 'Straight off the crag',
    category: 'wind',
    description:
      'The straight flute gone thin and late, followed at 3.5 seconds by one dull follower and nothing more.',
    preview: NO_ANSWER,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { blow: 0.2, breath: 0.5, attack: 0.2, release: 1 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { gap: 3.5, tone: 1500, spread: 0.9, mix: 0.4 },
      },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.4 } },
    ],
  },
  {
    id: 'calls-across-valley-reed-pipes-all-chiff',
    name: 'Reed pipes, all chiff',
    category: 'wind',
    description:
      'Pan pipes tongued hard, their attacks brought forward and a hollow tube pressed on the tone that follows.',
    preview: LONG_WOOD,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: {
        volume: -4,
        chiff: 1,
        blow: 0.8,
        release: 0.12,
        scoop: 0,
        attack: 0.005,
        breath: 0.2,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strikes forward' },
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.6, shift: 5 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'calls-across-valley-pipes-behind-the-birches',
    name: 'Pipes behind the birches',
    category: 'pad',
    description:
      'Whispered pan pipes caught in a frozen cloud of grains, some turned backwards, that hangs on long after.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { blow: 0.2, attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Frozen haze', params: { feedback: 0.75, mix: 0.5 } },
      { deviceId: 'lift', preset: 'Only the tails', params: { hear: 0, threshold: -32 } },
    ],
  },
  {
    id: 'calls-across-valley-low-flute-in-the-doorway',
    name: 'Low flute in the doorway',
    category: 'wind',
    description:
      'An alto flute scooped up from a little below, warm and close, its breath laid wide about it.',
    preview: LURE,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { volume: -5.5, vibrato: 0.1, scoop: 35, attack: 0.05, release: 0.6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'calls-across-valley-low-flute-under-fog',
    name: 'Low flute under fog',
    category: 'pad',
    description:
      'A low flute drone with every attack dissolved, then wrapped in a dark reversed swell two seconds long.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { vibrato: 0.1, attack: 0.6, release: 4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'calls-across-valley-bent-call-at-the-stile',
    name: 'Bent call at the stile',
    category: 'wind',
    description:
      'A bamboo flute that slides up two hundred cents into every note, close up on an old combo speaker.',
    preview: TWO_SLOPES,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { release: 0.4, breath: 0.6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { distance: 0.15, noise: 0 } },
    ],
  },
  {
    id: 'calls-across-valley-bent-call-unbending',
    name: 'Bent call unbending',
    category: 'wind',
    description:
      'A bamboo flute with a slow deep sway, its tail sagging in pitch and darkening like wax as it rings.',
    preview: BLUE_CALL,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { vibrato: 0.5, blow: 0.2, attack: 0.2, release: 1.6, scoop: 30 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.5 } }],
  },
  {
    id: 'calls-across-valley-whistle-through-fingers',
    name: 'Whistle through fingers',
    category: 'wind',
    description:
      'A hard blown flute with a small body and no sway, its piercing tones tamed and its top rounded.',
    preview: HIGH_CALL,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { vibrato: 0, scoop: 25, release: 0.2, blow: 0.85 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.6 } },
      { deviceId: 'tamer', preset: 'Harsh sample' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
    ],
  },
  {
    id: 'calls-across-valley-whistle-of-someone-else',
    name: 'Whistle of someone else',
    category: 'wind',
    description:
      'A soft flute lead turned into two birds that wheel close by, with a vibrato that only comes to long notes.',
    preview: BLUE_CALL,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { vibrato: 0, scoop: 0, attack: 0.15, release: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Long patience', params: { wait: 700, grow: 1100 } },
      { deviceId: 'murmuration', preset: 'Two close by', params: { range: 12, mix: 0.55 } },
    ],
  },
  {
    id: 'calls-across-valley-pipe-on-a-milking-stool',
    name: 'Pipe on a milking stool',
    category: 'wind',
    description:
      'A soft recorder doubled a fifth above and a pale octave below, all of it narrow and short.',
    preview: LURE,
    instrument: { deviceId: 'flute', preset: 'Soft recorder', params: { blow: 0.2, release: 0.3 } },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Fifth above',
        params: { pitchB: -12, levelB: 0.4, mix: 0.35 },
      },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'calls-across-valley-flute-at-the-smoke-hole',
    name: 'Flute at the smoke hole',
    category: 'wind',
    description:
      'A bamboo flute breathed hard through a blown bottle and on into one slack dripping spring.',
    preview: HORN_CALL,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { vibrato: 0.2, scoop: 60, breath: 0.8, attack: 0.04, release: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.3, tone: 3000 } },
    ],
  },
  {
    id: 'calls-across-valley-breath-off-the-glacier',
    name: 'Breath off the glacier',
    category: 'pad',
    description:
      'A flute breath pad shifted a few hertz apart left and right, in tails that drift down through winter.',
    preview: HORN_FIFTHS,
    instrument: { deviceId: 'flute', preset: 'Breath pad', params: { attack: 0.6, release: 3 } },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { fine: 2 } },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.4, interval: 1 } },
    ],
  },
  {
    id: 'calls-across-valley-loop-round-the-pasture',
    name: 'Loop round the pasture',
    category: 'pad',
    description:
      'Hollow pan pipes fed into a worn tape loop of 3.6 seconds, each pass thinner and farther than the last.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { volume: -3, attack: 0.5, release: 1.6, breath: 0.4 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Thin and distant', params: { length: 3.6, mix: 0.45 } },
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { depth: 0.6 } },
    ],
  },

  // Choir: the herders themselves, one throat or a hillside of them, straight and without sway when near.
  {
    id: 'calls-across-valley-hand-beside-the-mouth',
    name: 'Hand beside the mouth',
    category: 'voice',
    description:
      'One high treble on an open ah, perfectly straight and quick to start, the top shaded so it does not pierce.',
    preview: HIGH_CALL,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        volume: -4,
        voice: 1.34,
        vibrato: 0,
        motion: 0,
        attack: 0.04,
        release: 0.25,
        width: 0.1,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5200 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'calls-across-valley-from-the-other-side',
    name: 'From the other side',
    category: 'voice',
    description:
      'The same treble rounded to oo and full of air, six cents flat, placed at the far shore of a five second space.',
    preview: HIGH_BACK,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        volume: -5,
        vowel: 0.9,
        voice: 1.3,
        vibrato: 0,
        breath: 0.5,
        attack: 0.18,
        release: 1.4,
        tone: 3000,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0, fine: -6 } },
      { deviceId: 'distance', preset: 'Far shore' },
    ],
  },
  {
    id: 'calls-across-valley-treble-for-two-slopes',
    name: 'Treble for two slopes',
    category: 'voice',
    description:
      'One straight eh of a voice skipped off two slopes, the second return 9 dB under the first, duller and six cents flat.',
    preview: NO_ANSWER,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: {
        volume: -2,
        ensemble: 0,
        voice: 1.28,
        vibrato: 0,
        motion: 0,
        attack: 0.06,
        release: 0.4,
        width: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Two skips',
        params: {
          first: 2000,
          bounce: 1,
          skips: 2,
          loss: 9,
          sink: 0.7,
          drop: 6,
          throw: 1,
          mix: 0.35,
        },
      },
    ],
  },
  {
    id: 'calls-across-valley-low-lure-close-by',
    name: 'Low lure, close by',
    category: 'voice',
    description:
      'A single low oo held right at the ear, its breath and quiet formants lifted and its width folded away.',
    preview: LURE,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        volume: -5,
        ensemble: 0,
        voice: 0.95,
        vibrato: 0,
        motion: 0,
        attack: 0.1,
        release: 0.4,
        breath: 0.4,
      },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'calls-across-valley-lure-heard-from-the-barn',
    name: 'Lure heard from the barn',
    category: 'voice',
    description:
      'Hummed voices through the wall: next door, dark and dry, a worn cassette turning somewhere behind them.',
    preview: LURE,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { volume: -3.5, vowel: 1, tone: 1600, attack: 0.3, release: 0.8, vibrato: 0 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
    ],
  },
  {
    id: 'calls-across-valley-fathers-at-the-fence',
    name: 'Fathers at the fence',
    category: 'voice',
    description:
      'Bass voices on a plain ah with a firm start, short spliced copies of them added a fourth below.',
    preview: LOW_CALL,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { volume: -5, vibrato: 0, attack: 0.1, release: 0.6 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Fourth below', params: { mix: 0.35 } }],
  },
  {
    id: 'calls-across-valley-fathers-gone-home',
    name: 'Fathers gone home',
    category: 'voice',
    description:
      'Low monks slowed and dark, only what each moment shares with the last let through, in a singing hall.',
    preview: GROUND,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { volume: -5.5, attack: 0.9, release: 2.5, tone: 1800 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes' },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 8, mix: 0.4 } },
    ],
  },
  {
    id: 'calls-across-valley-girls-along-the-wall',
    name: 'Girls along the wall',
    category: 'voice',
    description:
      'Short bright ahs in a loose line, doubled by two detuned singers a few milliseconds behind.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { volume: -6, voice: 1.3, release: 0.35, breath: 0.2, attack: 0.02 },
    },
    effects: [{ deviceId: 'pitch-shifter', preset: 'Doubler', params: { mix: 0.4 } }],
  },
  {
    id: 'calls-across-valley-girls-over-the-brow',
    name: 'Girls over the brow',
    category: 'voice',
    description:
      'Thin ee voices, half breath, taken up by two loops of unequal length that drift apart as they repeat.',
    preview: TWO_SLOPES,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { volume: -6, attack: 0.25, release: 0.9, tone: 5000 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Two voices', params: { feedback: 0.7, wear: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'calls-across-valley-tenors-over-the-hay',
    name: 'Tenors over the hay',
    category: 'voice',
    description:
      'Tenors on oh, level and warm, copied wide on both sides without any sweep, with a light console push.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { vibrato: 4, attack: 0.15, release: 0.6 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'analog-drive', preset: 'Console' },
    ],
  },
  {
    id: 'calls-across-valley-the-valley-unprompted',
    name: 'The valley, unprompted',
    category: 'pad',
    description:
      'A distant choir with its top rolled off, rising out of dark swells that grow for four seconds.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 1.2, release: 4, tone: 2600 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Dark swell', params: { mix: 0.6 } }],
  },
  {
    id: 'calls-across-valley-throats-of-thin-ice',
    name: 'Throats of thin ice',
    category: 'pad',
    description:
      'Ee voices redrawn as sixteen pure sines, partial by partial, with slow light moving across the bands.',
    preview: HORN_FIFTHS,
    instrument: { deviceId: 'choir', preset: 'Glass ee', params: { attack: 0.5, release: 2.5 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Glass redraw', params: { mix: 0.85 } },
      { deviceId: 'glimmer', preset: 'Slow weather' },
    ],
  },
  {
    id: 'calls-across-valley-blue-third-sung-flat-out',
    name: 'Blue third sung flat out',
    category: 'voice',
    description:
      'Altos on eh without sway, one shifted gently against itself so the held tones beat very slowly, in a dark plate.',
    preview: BLUE_CALL,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -3.5, vibrato: 0, ensemble: 0.2, attack: 0.08, release: 0.5, breath: 0.1 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { feedback: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'calls-across-valley-only-air-answers',
    name: 'Only air answers',
    category: 'texture',
    description:
      'Voices with nothing but breath in them under dry gusts, so that a call goes out and the gap stays open.',
    preview: NO_ANSWER,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { volume: -5, attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Dry gusts', params: { exposure: 0.5, voice: 0.1 } },
      {
        deviceId: 'noise-floor',
        preset: 'Close mic',
        params: { type: 6, level: -48, movement: 0.7 },
      },
    ],
  },
  {
    id: 'calls-across-valley-hillside-of-vowels',
    name: 'Hillside of vowels',
    category: 'pad',
    description:
      'A wide choir that keeps changing vowel, spread into a dull far cloud of sixteen birds.',
    preview: VALLEY_CHORD,
    instrument: { deviceId: 'choir', preset: 'Slow vowels', params: { attack: 1, release: 3.5 } },
    effects: [{ deviceId: 'murmuration', preset: 'Cloud far off' }],
  },

  // Flock: the herd's own answer, and many callers at once.
  {
    id: 'calls-across-valley-kids-running-in',
    name: 'Kids running in',
    category: 'texture',
    description:
      'Six small voices called from all round that chirp as they arrive, in a bright tank with two seconds of ring.',
    preview: HERD,
    instrument: {
      deviceId: 'flock',
      preset: 'Dawn calls',
      params: { gather: 0.15, leave: 0.8, octaves: 0.2 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 2, mix: 0.2 } },
    ],
  },
  {
    id: 'calls-across-valley-one-caller-no-herd',
    name: 'One caller, no herd',
    category: 'voice',
    description:
      'A single gliding whistle in the middle, and far behind it one late point of echo with its top gone.',
    preview: HIGH_CALL,
    instrument: { deviceId: 'flock', preset: 'One whistle', params: { gather: 0.1, leave: 0.4 } },
    effects: [
      { deviceId: 'constellation', preset: 'One far star', params: { span: 3500, tone: 1800 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'calls-across-valley-cattle-slow-at-the-col',
    name: 'Cattle slow at the col',
    category: 'pad',
    description:
      'A dark murmur of voices gathering for two seconds, pulled apart in slow tides of bands.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { volume: -13, gather: 2, leave: 4 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'calls-across-valley-sheep-round-the-corner',
    name: 'Sheep round the corner',
    category: 'texture',
    description:
      'Reedy voices flying in from around, behind a slow notch and at the back of a hall.',
    preview: HERD,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { gather: 0.25, leave: 1.2, octaves: 0.1 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'calls-across-valley-calls-falling-home',
    name: 'Calls falling home',
    category: 'texture',
    description:
      'Voices that glide down from above onto the note and scatter, with one shadow an octave under, 1.5 s behind.',
    preview: HERD,
    instrument: { deviceId: 'flock', preset: 'Falling in', params: { gather: 0.6, leave: 2 } },
    effects: [
      { deviceId: 'canon', preset: 'Octave shadow', params: { gap: 1.5, tone: 2500 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },

  // Feedback: a fence wire held by the caller's own sound.
  {
    id: 'calls-across-valley-fence-wire-twelfth-post',
    name: 'Fence wire, twelfth post',
    category: 'string',
    description:
      'A wire plucked softly and caught on its third harmonic, clean and unwavering, in a warm cabinet.',
    preview: GROUND,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { volume: -2.5, bloom: 0.5, release: 1 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { noise: 0, drive: 0.1 } }],
  },
  {
    id: 'calls-across-valley-fence-wire-seventh-post',
    name: 'Fence wire, seventh post',
    category: 'string',
    description:
      'The wire fed until it sings its seventh harmonic, drifting and far, a long modulated space after it.',
    preview: VALLEY_CHORD,
    instrument: {
      deviceId: 'feedback',
      preset: 'High whistle',
      params: { volume: -3.5, distance: 7, bloom: 1.2, wander: 0.3, release: 3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { lowCut: 60 } },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'calls-across-valley-wire-plucked-and-dropped',
    name: 'Wire plucked and dropped',
    category: 'plucked',
    description:
      'The wire plucked hard and let die, its bite levelled, with a short trail of even echoes crossing over.',
    preview: HORN_CALL,
    instrument: {
      deviceId: 'feedback',
      preset: 'Plucked and gone',
      params: { volume: -1.5, damp: 0.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 330, loss: 3.5, mix: 0.3 },
      },
    ],
  },
  {
    id: 'calls-across-valley-wire-dark-all-night',
    name: 'Wire dark all night',
    category: 'drone',
    description:
      'A damped string that holds its ground note with hardly any grit, throbbing slowly in the lows, sinking for seconds.',
    preview: GROUND,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { volume: -4.5, bloom: 1, pick: 0.2, release: 5 },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        preset: 'One a second',
        params: { low: 60, high: 700, depth: 0.6 },
      },
      { deviceId: 'haze', preset: 'Faint warmth' },
    ],
  },

  // Rewind: the answer before the call.
  {
    id: 'calls-across-valley-bell-cow-walks-back',
    name: 'Bell cow walks back',
    category: 'bell',
    description:
      'Bells played backwards that swell for most of a second and ring on after the strike, with a dull hall behind.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: 3.5, swell: 0.8, tone: 0.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'calls-across-valley-answer-then-call',
    name: 'Answer, then call',
    category: 'keys',
    description:
      'A turned piano that stops dead on its strike, then is caught by a plain echo half a second on.',
    preview: HORN_BACK,
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { volume: 6, swell: 0.5, snap: 0.5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Plain repeat', params: { time: 520, tone: 3000 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'calls-across-valley-bowl-from-an-empty-pail',
    name: 'Bowl from an empty pail',
    category: 'bell',
    description:
      'Reversed bowls gathering for two seconds over still bowls tuned in C that ring with them.',
    preview: VALLEY_CHORD,
    instrument: { deviceId: 'rewind', preset: 'Bowl gather', params: { volume: 5, swell: 2 } },
    effects: [{ deviceId: 'bowls', preset: 'Still bowls', params: { root: 0 } }],
  },
  {
    id: 'calls-across-valley-pluck-the-hill-returned',
    name: 'Pluck the hill returned',
    category: 'plucked',
    description:
      'A pluck that comes in backwards and lands as the key is let go, warped a little and worn like an old record.',
    preview: HORN_FIFTHS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Wide drift',
      params: { volume: 3, swell: 1.2, shimmer: 0.4 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus', params: { crackle: 0.1 } },
      { deviceId: 'warp', preset: 'Thin glow', params: { mix: 0.3 } },
    ],
  },
]
