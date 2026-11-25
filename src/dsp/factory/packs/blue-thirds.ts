import { type FactoryPreset, type Phrase } from '../types'

// The third of C as a place between E flat and E: reached from below, resting near 350 cents, at
// the major third only for a moment over C. The seventh leans the same way. Laid out by how far each
// voice can lean (the steel bends, the others step or crush) and by how fast it gets there.

// Steel over C and G: E flat bent to the neutral third, to E for a moment and back down, then D and C.
const LEAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 7.2, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 5, note: 62.9, gain: 0.64 },
    { atSec: 1.1, durSec: 2.9, note: 63.45, gain: 0.6 },
    { atSec: 2.2, durSec: 0.8, note: 64, gain: 0.6 },
    { atSec: 4.5, durSec: 1.6, note: 62, gain: 0.5 },
    { atSec: 5.7, durSec: 1.5, note: 60, gain: 0.5 },
  ],
}
// Steel, C7 to F7: the leaning third is let down to E flat as the bass moves to F, where it is the seventh.
const SETTLE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 3.5, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 6.9, note: 62.9, gain: 0.64 },
    { atSec: 0.9, durSec: 2.7, note: 63.45, gain: 0.6 },
    { atSec: 1.8, durSec: 0.7, note: 64, gain: 0.6 },
    { atSec: 3.6, durSec: 3.6, note: 41, gain: 0.4 },
    { atSec: 3.6, durSec: 3.6, note: 48, gain: 0.36 },
    { atSec: 5.4, durSec: 0.7, note: 62, gain: 0.5 },
  ],
}
// Steel in double stops, C7 to G7: third and seventh of C lean one after the other, then the third of G.
const TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 3.6, note: 62.9, gain: 0.58 },
    { atSec: 0, durSec: 3.6, note: 69.9, gain: 0.5 },
    { atSec: 0.8, durSec: 1.9, note: 63.45, gain: 0.55 },
    { atSec: 1.3, durSec: 1.6, note: 70.45, gain: 0.5 },
    { atSec: 3.8, durSec: 3.4, note: 43, gain: 0.4 },
    { atSec: 3.8, durSec: 3.4, note: 57.9, gain: 0.58 },
    { atSec: 3.8, durSec: 3.4, note: 65, gain: 0.48 },
    { atSec: 4.6, durSec: 2.6, note: 58.45, gain: 0.55 },
  ],
}
// A single reed line over a C that is not played: G, the third scooped from below, D, C; then the low seventh.
const REED: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.9, note: 67, gain: 0.5 },
    { atSec: 0.9, durSec: 0.4, note: 63, gain: 0.52 },
    { atSec: 1.2, durSec: 0.4, note: 63.3, gain: 0.55 },
    { atSec: 1.5, durSec: 1.2, note: 63.55, gain: 0.6 },
    { atSec: 2.6, durSec: 0.5, note: 62, gain: 0.46 },
    { atSec: 3, durSec: 1, note: 60, gain: 0.5 },
    { atSec: 4.1, durSec: 0.45, note: 67, gain: 0.5 },
    { atSec: 4.5, durSec: 1, note: 69.7, gain: 0.58 },
    { atSec: 5.4, durSec: 0.45, note: 67, gain: 0.48 },
    { atSec: 5.8, durSec: 0.75, note: 63.5, gain: 0.52 },
    { atSec: 6.4, durSec: 1, note: 60, gain: 0.48 },
  ],
}
// A call with its third scooped in the upper octave, then another player's softer answer an octave below.
const CALL: Phrase = {
  notes: [
    { atSec: 0.2, durSec: 0.5, note: 72, gain: 0.58 },
    { atSec: 0.6, durSec: 0.3, note: 75, gain: 0.58 },
    { atSec: 0.8, durSec: 0.3, note: 75.3, gain: 0.6 },
    { atSec: 1, durSec: 0.9, note: 75.5, gain: 0.62 },
    { atSec: 1.85, durSec: 0.4, note: 74, gain: 0.52 },
    { atSec: 2.15, durSec: 1.2, note: 72, gain: 0.54 },
    { atSec: 3.9, durSec: 0.45, note: 67, gain: 0.44 },
    { atSec: 4.25, durSec: 0.85, note: 69.7, gain: 0.46 },
    { atSec: 5, durSec: 0.4, note: 67, gain: 0.42 },
    { atSec: 5.3, durSec: 0.35, note: 63.2, gain: 0.44 },
    { atSec: 5.55, durSec: 0.75, note: 63.5, gain: 0.46 },
    { atSec: 6.2, durSec: 1.1, note: 60, gain: 0.42 },
  ],
}
// One low line: C up to the leaning third, F, G, the flat seventh, and down again.
const LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 48, gain: 0.6 },
    { atSec: 0.85, durSec: 0.6, note: 50.9, gain: 0.56 },
    { atSec: 1.35, durSec: 0.9, note: 51.45, gain: 0.6 },
    { atSec: 2.2, durSec: 0.5, note: 53, gain: 0.54 },
    { atSec: 2.7, durSec: 1.1, note: 55, gain: 0.58 },
    { atSec: 3.9, durSec: 0.85, note: 57.7, gain: 0.6 },
    { atSec: 4.75, durSec: 0.5, note: 55, gain: 0.52 },
    { atSec: 5.25, durSec: 0.45, note: 53, gain: 0.5 },
    { atSec: 5.7, durSec: 0.65, note: 51.45, gain: 0.56 },
    { atSec: 6.35, durSec: 1, note: 48, gain: 0.56 },
  ],
}
// The minor version, Am7 to Dm7: no E in the chord, so the fifth can lean up to it from E flat; then F, E flat, D.
const MINOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 45, gain: 0.44 },
    { atSec: 0, durSec: 3.5, note: 55, gain: 0.34 },
    { atSec: 0, durSec: 3.5, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 1.4, note: 62.9, gain: 0.58 },
    { atSec: 1.25, durSec: 1, note: 63.45, gain: 0.56 },
    { atSec: 2.1, durSec: 1.4, note: 64, gain: 0.58 },
    { atSec: 3.7, durSec: 3.5, note: 50, gain: 0.44 },
    { atSec: 3.7, durSec: 3.5, note: 57, gain: 0.34 },
    { atSec: 3.7, durSec: 3.5, note: 60, gain: 0.34 },
    { atSec: 3.7, durSec: 1.4, note: 65, gain: 0.56 },
    { atSec: 5, durSec: 0.8, note: 63, gain: 0.5 },
    { atSec: 5.7, durSec: 1.5, note: 62, gain: 0.52 },
  ],
}
// C7, G7, F7, C7 in close chords over their roots, the thirds of C and of G neutral, the first one crushed.
const CHANGES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 58, gain: 0.42 },
    { atSec: 0, durSec: 0.14, note: 63, gain: 0.4 },
    { atSec: 0.1, durSec: 1.5, note: 63.5, gain: 0.52 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.46 },
    { atSec: 1.8, durSec: 1.7, note: 43, gain: 0.5 },
    { atSec: 1.8, durSec: 1.6, note: 58.5, gain: 0.48 },
    { atSec: 1.8, durSec: 1.6, note: 62, gain: 0.42 },
    { atSec: 1.8, durSec: 1.6, note: 65, gain: 0.44 },
    { atSec: 3.6, durSec: 1.7, note: 41, gain: 0.5 },
    { atSec: 3.6, durSec: 1.6, note: 57, gain: 0.42 },
    { atSec: 3.6, durSec: 1.6, note: 60, gain: 0.42 },
    { atSec: 3.6, durSec: 1.6, note: 63, gain: 0.5 },
    { atSec: 5.4, durSec: 1.9, note: 48, gain: 0.5 },
    { atSec: 5.4, durSec: 1.9, note: 55, gain: 0.4 },
    { atSec: 5.4, durSec: 1.9, note: 58, gain: 0.4 },
    { atSec: 5.4, durSec: 1.9, note: 63.5, gain: 0.5 },
  ],
}
// A hand that cannot bend: E flat crushed into E over C, A flat into a low A over F, E flat left standing.
const CRUSH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 48, gain: 0.44 },
    { atSec: 0, durSec: 3.5, note: 55, gain: 0.36 },
    { atSec: 0.4, durSec: 0.5, note: 67, gain: 0.52 },
    { atSec: 1, durSec: 0.14, note: 63, gain: 0.46 },
    { atSec: 1.08, durSec: 0.6, note: 64, gain: 0.56 },
    { atSec: 1.7, durSec: 0.7, note: 60, gain: 0.48 },
    { atSec: 2.4, durSec: 0.45, note: 69.7, gain: 0.54 },
    { atSec: 2.8, durSec: 0.8, note: 67, gain: 0.48 },
    { atSec: 3.7, durSec: 3.5, note: 41, gain: 0.44 },
    { atSec: 3.7, durSec: 3.5, note: 48, gain: 0.36 },
    { atSec: 3.9, durSec: 0.5, note: 72, gain: 0.52 },
    { atSec: 4.5, durSec: 0.14, note: 68, gain: 0.44 },
    { atSec: 4.58, durSec: 0.7, note: 68.5, gain: 0.54 },
    { atSec: 5.25, durSec: 0.45, note: 65, gain: 0.46 },
    { atSec: 5.65, durSec: 1.6, note: 63, gain: 0.52 },
  ],
}
// A single line in A minor for winds, over nothing: C, D, the fifth leaned up from E flat to E, G, then F, E flat, D, C, A.
const ALONE: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.65, note: 60, gain: 0.48 },
    { atSec: 0.65, durSec: 0.65, note: 62, gain: 0.5 },
    { atSec: 1.2, durSec: 0.45, note: 63, gain: 0.54 },
    { atSec: 1.55, durSec: 0.45, note: 63.4, gain: 0.57 },
    { atSec: 1.9, durSec: 1.2, note: 64, gain: 0.6 },
    { atSec: 3.3, durSec: 0.5, note: 67, gain: 0.52 },
    { atSec: 3.7, durSec: 0.8, note: 65, gain: 0.54 },
    { atSec: 4.4, durSec: 0.6, note: 63, gain: 0.52 },
    { atSec: 4.9, durSec: 0.7, note: 62, gain: 0.5 },
    { atSec: 5.5, durSec: 0.5, note: 60, gain: 0.46 },
    { atSec: 5.9, durSec: 1.4, note: 57, gain: 0.5 },
  ],
}
// Open fifths on C and on G with the third left to one voice, which leans up inside each.
const OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 3.6, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 3.6, note: 67, gain: 0.32 },
    { atSec: 0.3, durSec: 1.1, note: 63.1, gain: 0.48 },
    { atSec: 1.3, durSec: 1, note: 63.3, gain: 0.5 },
    { atSec: 2.2, durSec: 1.4, note: 63.5, gain: 0.52 },
    { atSec: 3.8, durSec: 3.5, note: 43, gain: 0.46 },
    { atSec: 3.8, durSec: 3.5, note: 50, gain: 0.4 },
    { atSec: 3.8, durSec: 3.5, note: 62, gain: 0.32 },
    { atSec: 4, durSec: 1, note: 58.2, gain: 0.48 },
    { atSec: 4.9, durSec: 2.4, note: 58.5, gain: 0.52 },
  ],
}
// C and G held from middle C up, the third between them in three long tones: E flat, a quarter of a semitone more, the neutral third; the flat seventh last.
const HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.46 },
    { atSec: 0, durSec: 7.2, note: 67, gain: 0.36 },
    { atSec: 0.4, durSec: 2, note: 63, gain: 0.5 },
    { atSec: 2.1, durSec: 2, note: 63.25, gain: 0.52 },
    { atSec: 3.8, durSec: 3.4, note: 63.5, gain: 0.54 },
    { atSec: 5, durSec: 2.2, note: 69.7, gain: 0.42 },
  ],
}
// Four close voices with no bass, C7 G7 F7 C7, none moving more than a tone: the third goes E neutral, the neutral third of G, E flat, E neutral.
const CHORALE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 58, gain: 0.42 },
    { atSec: 0, durSec: 1.8, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 1.8, note: 63.5, gain: 0.52 },
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.42 },
    { atSec: 1.8, durSec: 1.8, note: 58.5, gain: 0.52 },
    { atSec: 1.8, durSec: 1.8, note: 62, gain: 0.42 },
    { atSec: 1.8, durSec: 1.8, note: 65, gain: 0.42 },
    { atSec: 1.8, durSec: 1.8, note: 67, gain: 0.42 },
    { atSec: 3.6, durSec: 1.8, note: 57, gain: 0.42 },
    { atSec: 3.6, durSec: 1.8, note: 60, gain: 0.42 },
    { atSec: 3.6, durSec: 1.8, note: 63, gain: 0.52 },
    { atSec: 3.6, durSec: 1.8, note: 65, gain: 0.42 },
    { atSec: 5.4, durSec: 1.9, note: 58, gain: 0.42 },
    { atSec: 5.4, durSec: 1.9, note: 60, gain: 0.42 },
    { atSec: 5.4, durSec: 1.9, note: 63.5, gain: 0.52 },
    { atSec: 5.4, durSec: 1.9, note: 67, gain: 0.42 },
  ],
}
// Two chords for slow attacks: C7 with the neutral third on top, F7 with the same voice down on E flat.
const SLOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.7, note: 48, gain: 0.54 },
    { atSec: 0, durSec: 3.7, note: 55, gain: 0.46 },
    { atSec: 0, durSec: 3.7, note: 58, gain: 0.46 },
    { atSec: 0, durSec: 3.7, note: 63.5, gain: 0.56 },
    { atSec: 3.6, durSec: 3.7, note: 41, gain: 0.54 },
    { atSec: 3.6, durSec: 3.7, note: 53, gain: 0.46 },
    { atSec: 3.6, durSec: 3.7, note: 57, gain: 0.46 },
    { atSec: 3.6, durSec: 3.7, note: 63, gain: 0.56 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Pedal steel: overlapping neighbours bend the held string, from a fortieth of a second to almost one.
  {
    id: 'blue-thirds-late-to-the-third',
    name: 'Late to the third',
    category: 'string',
    preview: LEAN,
    description:
      'A steel that bends over two thirds of a second, with no bar shake until a late vibrato opens on held notes, on a small plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { glide: 660, vibrato: 0, pick: 0.6, tone: 3600, sustain: 22 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 700 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'blue-thirds-cold-slide-upward',
    name: 'Cold slide, upward',
    category: 'pad',
    preview: SETTLE,
    description:
      'A glassy steel with a slow swell and no shake, followed by a thin copy whose pitch climbs the longer it rings.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.1, glide: 520, tone: 2600 },
    },
    effects: [
      {
        deviceId: 'melt',
        preset: 'Narrow thread',
        params: { sag: 24, hold: 5, width: 0.8, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 5 } },
    ],
  },
  {
    id: 'blue-thirds-tobacco-tin-slide',
    name: 'Tobacco tin slide',
    category: 'plucked',
    preview: LEAN,
    description:
      'A hard-picked lap steel ringing inside a small tin, its short spring chattering after each bend.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { range: 3, glide: 240, sustain: 5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.55 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'blue-thirds-hammered-on-from-flat',
    name: 'Hammered on from flat',
    category: 'plucked',
    preview: TWINS,
    description:
      'A bright pick that reaches the next note in a fortieth of a second, followed by seven wide scattered echoes.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { volume: -10, glide: 25, vibrato: 0, sustain: 9 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.32, span: 1500 } },
    ],
  },
  {
    id: 'blue-thirds-thumb-below-the-flat',
    name: 'Thumb below the flat',
    category: 'bass',
    preview: LOW,
    description:
      'A steel picked with the flesh of the thumb, dark and round, warmed by a triode and one short dull spring.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { glide: 300, vibrato: 0, sustain: 12, tone: 1500 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'blue-thirds-cellos-at-the-window',
    name: 'Cellos at the window',
    category: 'pad',
    preview: TWINS,
    description:
      'A dark swelling steel with a low, dull string pad growing out of it and outlasting it.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { volume: -3.5, range: 2, glide: 400, swell: 0.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 0.8, mix: 0.65 } },
    ],
  },
  {
    id: 'blue-thirds-levee-before-sunrise',
    name: 'Levee before sunrise',
    category: 'pad',
    preview: SETTLE,
    description:
      'A swell of over a second and a slow shake, its highs let through, in a vast modulated space whose tail swells in.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 1.2, range: 2, glide: 600, tone: 5200 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 11, mix: 0.45, highCut: 9000 } },
    ],
  },
  {
    id: 'blue-thirds-parlour-record-steel',
    name: 'Parlour record steel',
    category: 'string',
    preview: LEAN,
    description:
      'A steel shaken forty cents either side, heard from a crackling record turning fast, its bass and its top cut away.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { range: 2, glide: 150, sustain: 8, tone: 3000 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78', params: { warp: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'blue-thirds-amp-keeps-it-aloft',
    name: 'Amp keeps it aloft',
    category: 'string',
    preview: LEAN,
    description:
      'A lead steel with a wide vibrato whose held notes feed back into an overtone, with slow chorused echoes behind.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { range: 2, glide: 260, swell: 0.3, tone: 2400 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.55, gain: 0.74 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 620, mix: 0.28 } },
    ],
  },
  {
    id: 'blue-thirds-steps-down-to-e-flat',
    name: 'Steps down to E flat',
    category: 'plucked',
    preview: SETTLE,
    description:
      'A dying slide over most of a second, its echoes landing closer together and each one thirty-five cents flatter.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { sustain: 3, pick: 0.8 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Skipping stone',
        params: { first: 420, drop: 35, mix: 0.45 },
      },
    ],
  },
  {
    id: 'blue-thirds-dry-yard-twang',
    name: 'Dry yard twang',
    category: 'plucked',
    preview: LEAN,
    description:
      'A short bright steel with no swell or shake that still bends a tone, bitten by a tube and slapped once by tape.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { volume: -12, range: 2, glide: 110 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'blue-thirds-ceiling-fan-steel',
    name: 'Ceiling fan steel',
    category: 'string',
    preview: MINOR,
    description:
      'Half-second bends on a bright, short, hard-picked steel, through a fast rotating cabinet in a stone stairwell.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: {
        volume: -1.5,
        range: 2,
        glide: 480,
        sustain: 3,
        vibrato: 0,
        pick: 0.9,
        tone: 5500,
        swell: 0,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl' },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
  {
    id: 'blue-thirds-bent-before-it-began',
    name: 'Bent before it began',
    category: 'texture',
    preview: TWINS,
    description:
      'A hard bright steel that fades early, answered by its own playing turned backwards in second-long swells.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.1, range: 2, sustain: 3 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 1000, smooth: 0.6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'blue-thirds-steel-from-over-river',
    name: 'Steel from over river',
    category: 'string',
    preview: SETTLE,
    description:
      'A slow swelling slide received on a fading night radio, narrow and hissing, with whistles off the station.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Swelling slide',
      params: { swell: 0.7, range: 2, sustain: 16 },
    },
    effects: [{ deviceId: 'radio', preset: 'Far station', params: { fading: 0.7, static: 0.3 } }],
  },
  {
    id: 'blue-thirds-cellar-strings-bend',
    name: 'Cellar strings bend',
    category: 'bass',
    preview: LOW,
    description:
      'A steel with a copy an octave below it under a low filter, bending a tone in a third of a second, levelled afterwards.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.1, glide: 330, tone: 1800, vibrato: 3, pick: 0.7 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 1, filter: 700, dry: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'blue-thirds-caught-mid-bend',
    name: 'Caught mid bend',
    category: 'pad',
    preview: TWINS,
    description:
      'Only the caught sound of the steel: each bend is frozen as it happens and glides slowly to the next held chord.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.15, glide: 120, range: 2, tone: 4600 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { glide: 1.2, attack: 0.3, decay: 12, tone: 0.3 },
      },
    ],
  },
  {
    id: 'blue-thirds-wires-learn-the-lean',
    name: 'Wires learn the lean',
    category: 'string',
    preview: MINOR,
    description:
      'A picked steel beside a rack of strings that tune themselves to what is played and go on ringing after it.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { range: 2, pick: 0.35, glide: 180, sustain: 4, tone: 3800 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.7 } }],
  },

  // Tine piano: it cannot bend, so it crushes the flat note into the one above, from bark to dark felt.
  {
    id: 'blue-thirds-crushed-in-the-corner',
    name: 'Crushed in the corner',
    category: 'keys',
    preview: CRUSH,
    description:
      'A short barking electric piano through a small speaker driven hard at its edge, with one gated slap in the middle.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { volume: -13.5, bark: 0.95, decay: 0.5, bell: 0.1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { speaker: 0 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap' },
    ],
  },
  {
    id: 'blue-thirds-soot-on-the-tines',
    name: 'Soot on the tines',
    category: 'keys',
    preview: CHANGES,
    description:
      'Dark tines with a long decay, all of them sent through a wide eight-stage phaser and left on a damped plate.',
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { decay: 2.2, bell: 0.2 } },
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'blue-thirds-tines-that-climb',
    name: 'Tines that climb',
    category: 'texture',
    preview: CRUSH,
    description:
      'Bell tines shadowed by small pieces of themselves that each rise half a semitone as they fade.',
    instrument: { deviceId: 'tine-piano', preset: 'Bell tines', params: { decay: 2 } },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Wilting',
        params: { fall: 0.5, size: 1300, mix: 0.6, vary: 0.1 },
      },
    ],
  },
  {
    id: 'blue-thirds-closing-time-tines',
    name: 'Closing time tines',
    category: 'keys',
    preview: CHANGES,
    description:
      'A suitcase piano under a full-depth throb in mono, worn and wobbling on cassette tape.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremoloRate: 2.4, tone: 0.5 },
    },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.6 } }],
  },
  {
    id: 'blue-thirds-glass-thirds-on-ice',
    name: 'Glass thirds on ice',
    category: 'bell',
    preview: CALL,
    description:
      'Short glassy tines sent through slow echoes that split from low to high and smear as they repeat.',
    instrument: { deviceId: 'tine-piano', preset: 'Glass bells', params: { release: 0.6 } },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.45, time: 1600 } }],
  },
  {
    id: 'blue-thirds-muted-comp-at-noon',
    name: 'Muted comp at noon',
    category: 'keys',
    preview: CHANGES,
    description:
      'Tines stopped almost at once, a touch-driven band-pass opening with each strike and nothing left after.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -0.5, hardness: 0.8 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.8 } }],
  },
  {
    id: 'blue-thirds-everything-left-on',
    name: 'Everything left on',
    category: 'pad',
    preview: MINOR,
    description:
      'Tines with the dampers off, their strikes fogged away and the cloud carried round the head in a slow figure of eight.',
    instrument: { deviceId: 'tine-piano', preset: 'Dampers off', params: { tone: 0.5 } },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 350 } },
      { deviceId: 'around', preset: 'Slow eight' },
    ],
  },
  {
    id: 'blue-thirds-keys-below-the-landing',
    name: 'Keys below the landing',
    category: 'pad',
    preview: CHANGES,
    description:
      'Round tines with no bell, just under choppy water that wavers twice a second, then pulled wide.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { volume: -18.5, hardness: 0.6, tone: 0.75, drive: 0, release: 0.4, decay: 1.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Choppy water', params: { depth: 0.2 } },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
  },
  {
    id: 'blue-thirds-slow-crossing-tines',
    name: 'Slow crossing tines',
    category: 'keys',
    preview: CALL,
    description:
      'Tines panned all the way across every eight seconds, with a three-head tape echo behind them.',
    instrument: { deviceId: 'tine-piano', preset: 'Glacial pan', params: { bell: 0.5 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.45 } }],
  },
  {
    id: 'blue-thirds-flat-note-catches-light',
    name: 'Flat note catches light',
    category: 'bell',
    preview: CRUSH,
    description:
      'A fast full-depth tremolo on bright bell tines, thinned of lows, in a bright chamber.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { tremoloRate: 6.5, tremolo: 1, decay: 1.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'blue-thirds-buzz-behind-the-tine',
    name: 'Buzz behind the tine',
    category: 'keys',
    preview: MINOR,
    description:
      'All bark and no bell, struck with the softest hammer, driven through a rotary cabinet whose rotors are stopped.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { volume: -16, tremolo: 0, release: 0.3 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Parked growl' }],
  },
  {
    id: 'blue-thirds-tines-through-a-fuse',
    name: 'Tines through a fuse',
    category: 'keys',
    preview: CHANGES,
    description:
      'An overdriven electric piano pushed into a dark fuzz cut at 2400 Hz, its level switching on and off like a loose lamp.',
    instrument: { deviceId: 'tine-piano', preset: 'Warm overdrive', params: { volume: -6 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 3.3, depth: 0.9 } },
    ],
  },
  {
    id: 'blue-thirds-tine-bowed-from-below',
    name: 'Tine bowed from below',
    category: 'pad',
    preview: SLOW,
    description:
      'Long tines with every strike removed, so each chord fades in as if bowed, with a slow wide chorus.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0, decay: 4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'blue-thirds-left-hand-in-the-dark',
    name: 'Left hand in the dark',
    category: 'bass',
    preview: LOW,
    description:
      'A soft electric piano moved an octave down with its body kept, its highs shaded, as a bass for the left hand.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tremolo: 0, bark: 0.6 },
    },
    effects: [
      { deviceId: 'size', preset: 'Octave below' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'blue-thirds-bar-radio-piano',
    name: 'Bar radio piano',
    category: 'keys',
    preview: CHANGES,
    description:
      'A fast tremolo piano in mono heard from a small transistor set, close and clear and narrow.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { volume: -14, tremolo: 0.35 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.06, interference: 0.03 } },
    ],
  },
  {
    id: 'blue-thirds-tines-remember-slowly',
    name: 'Tines remember slowly',
    category: 'texture',
    preview: CRUSH,
    description:
      'Tines with moments of earlier playing drifting back, some backwards or at half speed, set a few steps away.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremoloRate: 0.7, bell: 0.3 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'No echo', params: { reach: 5, vary: 0.8, mix: 0.6 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'blue-thirds-bowls-of-c-and-g',
    name: 'Bowls of C and G',
    category: 'bell',
    preview: CRUSH,
    description:
      'A hard bell-like tine over metal bowls tuned to C and G alone, so no third but the played one rings on.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { hardness: 1, decay: 0.5, tone: 1, tremolo: 0 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 4,
          bowls: 6,
          ring: 16,
          strike: 0.7,
          beat: 0.2,
          mix: 0.55,
          register: 0.4,
        },
      },
    ],
  },

  // Horns: a plunger's distance from the third, from one muted trumpet to a section that leans together.
  {
    id: 'blue-thirds-mute-half-closed',
    name: 'Mute half closed',
    category: 'wind',
    preview: CALL,
    description:
      'A muted trumpet close by, a slow auto filter opening and closing over it like a hand, with one tape slap.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.06, blow: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { cutoffHz: 1400, resonance: 2.5, driveDb: 0, lfoAmount: 45, lfoRateHz: 0.7 },
      },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'blue-thirds-flugel-asks-again',
    name: 'Flugel asks again',
    category: 'wind',
    preview: REED,
    description:
      'A breathy flugelhorn answered by itself a second and a half later an octave down, softer and duller.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { volume: -0.5, attack: 0.12, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { gap: 1.5, interval1: -12, tone: 2500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'blue-thirds-brass-under-streetlight',
    name: 'Brass under streetlight',
    category: 'pad',
    preview: SLOW,
    description:
      'A full horn section swelling in over a second and a half, in a huge dark reverb, all of it pulled as wide as it goes.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { volume: -1.5, attack: 1.4, section: 1, blow: 0.7 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Low cathedral',
        params: { decay: 14, highCut: 2600, mix: 0.4 },
      },
      { deviceId: 'spread', preset: 'Everything wide' },
    ],
  },
  {
    id: 'blue-thirds-tailgate-slide',
    name: 'Tailgate slide',
    category: 'wind',
    preview: LOW,
    description:
      'One trombone, quick to speak and loud, pushed through a console and heard across a bare room.',
    instrument: { deviceId: 'horns', preset: 'Trombone', params: { volume: 0, vibrato: 0.5 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'blue-thirds-tuba-on-the-ferry',
    name: 'Tuba on the ferry',
    category: 'bass',
    preview: LOW,
    description:
      'A soft tuba with air in it, its low end bumped by a transformer and everything above 1200 Hz muffled.',
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.12, release: 0.6, blow: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'blue-thirds-ballad-that-wavers',
    name: 'Ballad that wavers',
    category: 'wind',
    preview: ALONE,
    description:
      'An open trumpet with a wide vibrato, recorded on seasick tape and left in a small bright tank of reverb.',
    instrument: { deviceId: 'horns', preset: 'Ballad trumpet', params: { volume: -2 } },
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'blue-thirds-second-line-at-dusk',
    name: 'Second line at dusk',
    category: 'wind',
    preview: CHORALE,
    description:
      'A section of trumpets scattered as sixteen moving copies and warmed by a tape curve.',
    instrument: { deviceId: 'horns', preset: 'Brass band', params: { attack: 0.15, release: 0.6 } },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble' },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'blue-thirds-all-breath-no-brass',
    name: 'All breath, no brass',
    category: 'texture',
    preview: HELD,
    description:
      'A horn blown so softly that little but air is left, its quiet overtones turned up and its top widened.',
    instrument: { deviceId: 'horns', preset: 'Horn of air', params: { attack: 0.5 } },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'blue-thirds-fourths-over-the-yard',
    name: 'Fourths over the yard',
    category: 'wind',
    preview: REED,
    description:
      'A solo horn that carries a fourth below its line, dry but for a one second room that arrives late.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { volume: -1, attack: 0.1, release: 0.4, section: 0 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room' }],
  },
  {
    id: 'blue-thirds-mutes-in-a-row',
    name: 'Mutes in a row',
    category: 'pad',
    preview: CHORALE,
    description:
      'A section of muted brass under a harmonic tremolo whose two halves trade places three times a second.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: 0, attack: 0.3, release: 1, blow: 0.45 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3, depth: 1 } }],
  },
  {
    id: 'blue-thirds-flugels-sag-together',
    name: 'Flugels sag together',
    category: 'pad',
    preview: CHORALE,
    description:
      'A flugelhorn choir whose blurred tail sinks in pitch the longer it rings, with slow swells in three bands.',
    instrument: { deviceId: 'horns', preset: 'Flugel choir', params: { attack: 0.6 } },
    effects: [
      { deviceId: 'melt', preset: 'Slow melt', params: { sag: -25, mix: 0.55 } },
      { deviceId: 'currents', preset: 'Deep swell' },
    ],
  },
  {
    id: 'blue-thirds-horn-in-a-drain-pipe',
    name: 'Horn in a drain pipe',
    category: 'wind',
    preview: ALONE,
    description:
      'A solo horn played inside a small hard open pipe that rings on its own pitches, left nearly mono.',
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: -0.5, attack: 0.08, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Glass tube',
        params: { material: 1, size: 0.8, width: 0.1, mix: 0.7 },
      },
    ],
  },
  {
    id: 'blue-thirds-trumpet-off-the-levee',
    name: 'Trumpet off the levee',
    category: 'wind',
    preview: CALL,
    description:
      'A plain open trumpet whose echoes slow down as they go and cross sides, all of it set back in the open air.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: { volume: 0.5, harmony: 0, attack: 0.1, release: 0.5, blow: 0.5, breath: 0.2 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.45 } },
      { deviceId: 'distance', preset: 'Open air' },
    ],
  },
  {
    id: 'blue-thirds-fifths-keep-no-opinion',
    name: 'Fifths keep no opinion',
    category: 'drone',
    preview: HELD,
    description:
      'Flugelhorns that add a fifth to every key, with a wandering copy twenty-five cents sharp on the left and as much flat on the right.',
    instrument: { deviceId: 'horns', preset: 'Open fifths pad', params: { attack: 0.5 } },
    effects: [{ deviceId: 'stereo-detune', preset: 'Seasick', params: { detune: 25 } }],
  },
  {
    id: 'blue-thirds-choir-of-low-slides',
    name: 'Choir of low slides',
    category: 'pad',
    preview: SLOW,
    description:
      'A low brass section turned slowly by a rotary cabinet, its drum at full depth and its horn turned down.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.8, release: 2, blow: 0.6 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
  },
  {
    id: 'blue-thirds-plunger-makes-a-vowel',
    name: 'Plunger makes a vowel',
    category: 'wind',
    preview: CALL,
    description:
      'A loud trumpet pressed into the shape of a thin vowel and heard from a worn kitchen radio, its band narrowed.',
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { blow: 0.9, vibrato: 0.2, breath: 0, attack: 0.04, release: 0.3 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Thin vowel' },
      { deviceId: 'patina', preset: 'Kitchen radio' },
    ],
  },
  {
    id: 'blue-thirds-sevenths-rise-by-hours',
    name: 'Sevenths rise by hours',
    category: 'drone',
    preview: SLOW,
    description:
      'Horns that swell for two seconds and release for eight, with a bright string pad leaning an octave up growing from them.',
    instrument: { deviceId: 'horns', preset: 'Glacial horns', params: { attack: 2, vibrato: 0 } },
    effects: [{ deviceId: 'pad-follower', preset: 'Octave halo' }],
  },

  // Guitar: bowed with the volume pedal, crushed with a finger, or left to its amplifier.
  {
    id: 'blue-thirds-bowed-up-to-the-blue',
    name: 'Bowed up to the blue',
    category: 'string',
    preview: HELD,
    description:
      'A warm dark guitar swelled in like a bow, with a vibrato that opens on each held note, on a long plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { volume: 1, swell: 0.8 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 400, depth: 28 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'blue-thirds-porch-light-strum',
    name: 'Porch light strum',
    category: 'plucked',
    preview: CHANGES,
    description:
      'Chords strummed slowly on the neck pickup, with the drip of a surf spring and nothing more.',
    instrument: { deviceId: 'guitar', preset: 'Slow strum', params: { strum: 45, sustain: 6 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip' }],
  },
  {
    id: 'blue-thirds-thumb-on-the-flat-side',
    name: 'Thumb on the flat side',
    category: 'plucked',
    preview: CRUSH,
    description:
      'A soft thumb far from the bridge, its highs rolled off, through a warm stack with the microphone turned away.',
    instrument: { deviceId: 'guitar', preset: 'Thumb and neck', params: { shimmer: 0 } },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.3 } }],
  },
  {
    id: 'blue-thirds-valves-nearly-over',
    name: 'Valves nearly over',
    category: 'string',
    preview: CRUSH,
    description:
      'A warm guitar that breaks up when played hard, held on by a howl that blooms into an overtone and wanders.',
    instrument: { deviceId: 'guitar', preset: 'Warm breakup', params: { volume: -3, sustain: 14 } },
    effects: [{ deviceId: 'howl', preset: 'Wandering', params: { mix: 0.6 } }],
  },
  {
    id: 'blue-thirds-muted-freight-pattern',
    name: 'Muted freight pattern',
    category: 'plucked',
    preview: CHANGES,
    description:
      'Short strings picked near the bridge, their decay pulled up by a hard fast limiter, with a dotted tape bounce from side to side.',
    instrument: { deviceId: 'guitar', preset: 'Muted pattern', params: { volume: 6, sustain: 2 } },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -7.5 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'blue-thirds-doubled-strings-argue',
    name: 'Doubled strings argue',
    category: 'plucked',
    preview: OPEN,
    description:
      'A twelve-string with a wide detune between its pairs, spread further by a flanger moving very slowly.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { volume: 6, shimmer: 1.5, strum: 50 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'blue-thirds-baritone-after-supper',
    name: 'Baritone after supper',
    category: 'bass',
    preview: LOW,
    description:
      'A dark baritone guitar picked hard near the bridge, weighted by tape drive under a deep amp tremolo.',
    instrument: { deviceId: 'guitar', preset: 'Dark baritone', params: { volume: -0.5 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.6, depth: 0.7 } },
    ],
  },
  {
    id: 'blue-thirds-bridge-pickup-complains',
    name: 'Bridge pickup complains',
    category: 'plucked',
    preview: CALL,
    description:
      'A thin bright guitar at the bridge, its tone swept by a touch of wah and bitten by a pentode.',
    instrument: { deviceId: 'guitar', preset: 'Bridge twang', params: { volume: 1.5 } },
    effects: [
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { cutoffHz: 600, mix: 0.75 } },
      { deviceId: 'analog-drive', preset: 'Bite' },
    ],
  },
  {
    id: 'blue-thirds-reversed-quarter-tone',
    name: 'Reversed quarter tone',
    category: 'texture',
    preview: HELD,
    description:
      'A swelled guitar heard mostly backwards, in smooth overlapping pieces of more than a second and a half.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { swell: 0.4, tone: 4200 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.75 } }],
  },
  {
    id: 'blue-thirds-rolled-out-of-the-loft',
    name: 'Rolled out of the loft',
    category: 'plucked',
    preview: CHANGES,
    description:
      'A chord rolled string by string on a bright guitar, each note again as a dark scatter of twelve echoes.',
    instrument: { deviceId: 'guitar', preset: 'Harp roll', params: { volume: 2, sustain: 5 } },
    effects: [
      { deviceId: 'constellation', preset: 'Dark field', params: { again: 0.3, mix: 0.45 } },
    ],
  },
  {
    id: 'blue-thirds-growl-with-its-eyes-shut',
    name: 'Growl with its eyes shut',
    category: 'pad',
    preview: SLOW,
    description:
      'A thick long guitar behind a dark low wall of fuzz and reverb, its swells held back by a slow compressor.',
    instrument: { deviceId: 'guitar', preset: 'Thick growl', params: { volume: -5 } },
    effects: [
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
    ],
  },
  {
    id: 'blue-thirds-bell-at-the-bridge-end',
    name: 'Bell at the bridge end',
    category: 'bell',
    preview: CALL,
    description:
      'A hard clean note picked right at the bridge, faintly ring modulated on C, in a bright hall.',
    instrument: { deviceId: 'guitar', preset: 'Clean bell', params: { volume: 2 } },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { octave: 5, mix: 0.22 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'blue-thirds-dry-stops-flat-thirds',
    name: 'Dry stops, flat thirds',
    category: 'plucked',
    preview: CRUSH,
    description:
      'Dark notes stopped short with a harder pick, squashed by a fast limiter and put in a tight damped room.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark stops',
      params: { volume: 6, tone: 2600, hardness: 0.7 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'blue-thirds-pick-you-never-hear',
    name: 'Pick you never hear',
    category: 'pad',
    preview: OPEN,
    description:
      'Strings whose pick is hidden by a short swell, shadowed by sines that slide slowly from note to note.',
    instrument: { deviceId: 'guitar', preset: 'Hidden pick', params: { volume: 5 } },
    effects: [{ deviceId: 'sine-shadow', preset: 'Sliding sines', params: { mix: 0.65 } }],
  },
  {
    id: 'blue-thirds-one-wire-split-in-two',
    name: 'One wire split in two',
    category: 'string',
    preview: REED,
    description:
      'A glassy neck pickup with a fluttering copy a quarter tone sharp beside it, so each third is heard twice.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { volume: 4.5, sustain: 5, strum: 0 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Broken choir',
        params: { pitchA: 0, pitchB: 0, levelB: 0, detune: 50, mix: 0.4 },
      },
    ],
  },
  {
    id: 'blue-thirds-rolled-through-the-weeds',
    name: 'Rolled through the weeds',
    category: 'plucked',
    preview: MINOR,
    description:
      'A short dry guitar with a wide roll, out in a light wind that moves its tone and adds its own noise.',
    instrument: { deviceId: 'guitar', preset: 'Dry rolled chord', params: { sustain: 4 } },
    effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.25 } }],
  },

  // Reeds: subtone to growl, the scoop taken by the lip in two small steps or in one long breath.
  {
    id: 'blue-thirds-subtone-stove-door-open',
    name: 'Subtone, stove door open',
    category: 'wind',
    preview: REED,
    description:
      'A breathy subtone tenor with hardly any tone in it, on a worn slow record with more surface noise than pops.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { attack: 0.12, release: 0.35, breath: 1, blow: 0.12 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { pops: 0.1, surface: 0.6 } },
    ],
  },
  {
    id: 'blue-thirds-chalumeau-in-the-hold',
    name: 'Chalumeau in the hold',
    category: 'bass',
    preview: LOW,
    description:
      'A bass clarinet with copies one and two octaves down under a low filter, the body of it boxed in and dark.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.08, release: 0.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.5, sub1: 0.8 } },
      { deviceId: 'imprint', preset: 'Dark box' },
    ],
  },
  {
    id: 'blue-thirds-growls-up-to-it',
    name: 'Growls up to it',
    category: 'wind',
    preview: CALL,
    description: 'A growling tenor blown hard through a driven combo at the far end of a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { volume: -0.5, growl: 0.8 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { drive: 0.5 } }],
  },
  {
    id: 'blue-thirds-one-breath-one-third',
    name: 'One breath, one third',
    category: 'pad',
    preview: HELD,
    description:
      'A clarinet that takes a second to speak, its bands twinkling apart on either side, its low end spread wide.',
    instrument: { deviceId: 'clarinet', preset: 'From nothing', params: { attack: 1, release: 2 } },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.8 } },
      { deviceId: 'spread', preset: 'Wide bass' },
    ],
  },
  {
    id: 'blue-thirds-alto-leans-on-the-rail',
    name: 'Alto leans on the rail',
    category: 'wind',
    preview: ALONE,
    description:
      'An alto with a deep vibrato and two copies circling close by, warmed by soft saturation.',
    instrument: { deviceId: 'clarinet', preset: 'Ballad alto', params: { release: 0.5 } },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5, spread: 1 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 9, outputDb: -4 } },
    ],
  },
  {
    id: 'blue-thirds-double-reed-low-lamp',
    name: 'Double reed, low lamp',
    category: 'wind',
    preview: ALONE,
    description:
      'A double reed blown firmly with a wide vibrato, mostly heard as sixteen strings of A minor that it sets ringing.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { volume: 1, attack: 0.08, release: 0.3, vibrato: 0.9, blow: 0.7 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { decay: 9, mix: 0.85, strings: 12, sympathy: 0.9 },
      },
    ],
  },
  {
    id: 'blue-thirds-soprano-over-tin-roofs',
    name: 'Soprano over tin roofs',
    category: 'wind',
    preview: CALL,
    description:
      'A bright soprano reed through a negative flanger, hollowed out, with a fast chattering late splash of spring.',
    instrument: { deviceId: 'clarinet', preset: 'Bright soprano' },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow' },
      { deviceId: 'spring-reverb', preset: 'Late splash' },
    ],
  },
  {
    id: 'blue-thirds-whisper-on-the-flat',
    name: 'Whisper on the flat',
    category: 'texture',
    preview: HELD,
    description:
      'Breath with hardly a reed in it, smeared by a spectral blur, its quiet top brought up by a quick lift.',
    instrument: { deviceId: 'clarinet', preset: 'Reed whisper', params: { attack: 0.3 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Whisper' },
      { deviceId: 'lift', preset: 'Air on top' },
    ],
  },
  {
    id: 'blue-thirds-reeds-in-close-order',
    name: 'Reeds in close order',
    category: 'pad',
    preview: CHORALE,
    description:
      'A hollow clarinet section pulsed on the left and then on the right, two and a half steps a second.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { volume: -1, attack: 0.1 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Left then right' }],
  },
  {
    id: 'blue-thirds-fluttered-flat-seventh',
    name: 'Fluttered flat seventh',
    category: 'wind',
    preview: REED,
    description:
      'A flutter-tongued clarinet whose echoes part, shifted thirty-five hertz up on one side and down on the other.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { volume: 2.5, attack: 0.1, release: 0.4 },
    },
    effects: [{ deviceId: 'freq-shifter', preset: 'Parting echo' }],
  },
  {
    id: 'blue-thirds-throat-tones-downstairs',
    name: 'Throat tones downstairs',
    category: 'wind',
    preview: ALONE,
    description:
      'An open clarinet heard from next door, dark, narrow and with little room, its low end raised.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { vibrato: 0, blow: 0.8, release: 0.6, volume: -4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { level: 1 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'blue-thirds-tenor-out-of-the-fog',
    name: 'Tenor out of the fog',
    category: 'pad',
    preview: HELD,
    description:
      'A tenor that swells for over a second, every entry blurred into one soft bank with its body scooped out and its top raised.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { volume: 4, attack: 1.2, release: 2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Behind glass', params: { size: 300 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'blue-thirds-hum-under-the-reed',
    name: 'Hum under the reed',
    category: 'drone',
    preview: HELD,
    description:
      'A reed hummed almost without blowing, with ranks an octave below and above speaking nearly a second after it.',
    instrument: { deviceId: 'clarinet', preset: 'Reed hum' },
    effects: [{ deviceId: 'stops', preset: 'Breath first' }],
  },

  // Reed organ: C and G are the organ's; the third is whoever leans on it.
  {
    id: 'blue-thirds-bellows-mind-the-fifth',
    name: 'Bellows mind the fifth',
    category: 'organ',
    preview: OPEN,
    description:
      'A dark harmonium heavy on its low rank, thickened by a pushed reel, its bands swelling and drifting from side to side.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { octave: 0.15, twelfth: 0, sub: 0.8, celeste: 0.8, tone: 1600, volume: -12 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'currents', preset: 'Wide tide' },
    ],
  },
  {
    id: 'blue-thirds-storefront-organ',
    name: 'Storefront organ',
    category: 'organ',
    preview: CHANGES,
    description:
      'Every rank drawn and let go short, through a driven horn loudspeaker in a hall, then crossing wide dotted tape echoes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { fifteenth: 0.3, attack: 0.01, release: 0.05, sub: 0.2, volume: -15.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform' },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { feedback: 0.6, mix: 0.45 } },
    ],
  },
  {
    id: 'blue-thirds-flutes-for-the-offering',
    name: 'Flutes for the offering',
    category: 'organ',
    preview: CHORALE,
    description:
      'Short chapel flutes with a twelfth and a fifteenth drawn, fluttered quickly, in a small room that sparkles two octaves up.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: {
        twelfth: 0.35,
        fifteenth: 0.6,
        breath: 0.1,
        octave: 0,
        sub: 0,
        attack: 0.02,
        release: 0.15,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Fast flutter', params: { depth: 18 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'blue-thirds-one-rank-several-thirds',
    name: 'One rank, several thirds',
    category: 'organ',
    preview: HELD,
    description:
      'The beating celeste rank alone, with a copy fifty cents sharp on one side and fifty cents flat on the other.',
    instrument: { deviceId: 'organ', preset: 'Beating flutes', params: { attack: 0.2 } },
    effects: [{ deviceId: 'stereo-detune', preset: 'Melting', params: { feedback: 0.4 } }],
  },
  {
    id: 'blue-thirds-pumped-with-one-knee',
    name: 'Pumped with one knee',
    category: 'organ',
    preview: MINOR,
    description:
      'A wheezing pump organ with its own sound an octave down and twice as slow mixed in beneath it, the top raised.',
    instrument: { deviceId: 'organ', preset: 'Pump organ' },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'blue-thirds-accordion-past-the-gate',
    name: 'Accordion past the gate',
    category: 'organ',
    preview: CRUSH,
    description:
      'A dull accordion with a low rank added, wandering nearer and farther every few seconds, its pitch moving as it goes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { celeste: 0.2, sub: 0.5, tone: 2600 },
    },
    effects: [{ deviceId: 'distance', preset: 'Passing by' }],
  },
  {
    id: 'blue-thirds-voices-in-the-bellows',
    name: 'Voices in the bellows',
    category: 'organ',
    preview: CHORALE,
    description:
      'A trembling voice-like reed rank with a full tremulant, its reverb shaped by a sung vowel that drifts.',
    instrument: { deviceId: 'organ', preset: 'Vox humana', params: { tone: 3000 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 4 } }],
  },
  {
    id: 'blue-thirds-pedal-that-waits-on-c',
    name: 'Pedal that waits on C',
    category: 'drone',
    preview: OPEN,
    description:
      'A deep pedal rank, dark over 700 Hz, with a low drone of feedback held on top and slow breathing swells through it.',
    instrument: { deviceId: 'organ', preset: 'Deep pedal', params: { attack: 0.3 } },
    effects: [
      { deviceId: 'howl', preset: 'Low drone' },
      { deviceId: 'breath', preset: 'Dark lungs' },
    ],
  },
  {
    id: 'blue-thirds-wind-through-the-stops',
    name: 'Wind through the stops',
    category: 'texture',
    preview: OPEN,
    description:
      'A windy rank with all five stops pushed in, where only what stays from moment to moment is let through.',
    instrument: { deviceId: 'organ', preset: 'Windy flute' },
    effects: [{ deviceId: 'common-tones', preset: 'Only what stays' }],
  },
  {
    id: 'blue-thirds-next-door-plays-the-one',
    name: 'Next door plays the one',
    category: 'organ',
    preview: CHANGES,
    description:
      'A dull organ with its tone closed at 900 Hz, driven through a coarse ten-bit sampler.',
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { volume: -13, attack: 0.05, tone: 900 },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Dusty' }],
  },
  {
    id: 'blue-thirds-twelfths-leave-it-open',
    name: 'Twelfths leave it open',
    category: 'organ',
    preview: OPEN,
    description:
      'A hollow quint rank that sounds a twelfth over every key, thinned by a phaser that only falls.',
    instrument: { deviceId: 'organ', preset: 'Hollow quint', params: { octave: 0.15 } },
    effects: [{ deviceId: 'phaser', preset: 'Endless fall' }],
  },
  {
    id: 'blue-thirds-tremulant-at-the-turn',
    name: 'Tremulant at the turn',
    category: 'organ',
    preview: CHANGES,
    description:
      'A fully tremulant flute with a dark delay whose repeats drop an octave and slide.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 1, octave: 0.4 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Falling tape', params: { mix: 0.5 } }],
  },
  {
    id: 'blue-thirds-bright-pipes-by-degrees',
    name: 'Bright pipes by degrees',
    category: 'pad',
    preview: SLOW,
    description:
      'A bright pipe chorus swelling for over a second, its tail climbing by fifths in reversed grains above it.',
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1.2, release: 3 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths' }],
  },

  // Feedback: a string the amplifier holds on one overtone.
  {
    id: 'blue-thirds-string-the-amp-forgave',
    name: 'String the amp forgave',
    category: 'string',
    preview: REED,
    description:
      'A lightly plucked string caught by its amplifier within a tenth of a second, reedy, with short soft tape repeats.',
    instrument: { deviceId: 'feedback', preset: 'Reed tone', params: { grit: 0.4 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft' }],
  },
  {
    id: 'blue-thirds-twelfth-over-a-leaning-c',
    name: 'Twelfth over a leaning C',
    category: 'drone',
    preview: HELD,
    description:
      'Held strings that sing a pure twelfth above each key, carried round the head in a slow figure of eight, on a plate.',
    instrument: { deviceId: 'feedback', preset: 'Pure twelfth', params: { volume: 0, bloom: 0.5 } },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'blue-thirds-torn-speaker-open-fifth',
    name: 'Torn speaker, open fifth',
    category: 'string',
    preview: OPEN,
    description:
      'A gritty string torn at the edge, its top shaded off and a worn tape trail dragging after it.',
    instrument: { deviceId: 'feedback', preset: 'Torn edge', params: { crowd: 0.2 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'tape-echo', preset: 'Worn tape' },
    ],
  },
  {
    id: 'blue-thirds-bow-of-glass-on-e-flat',
    name: 'Bow of glass on E flat',
    category: 'pad',
    preview: OPEN,
    description:
      'No pick at all: the fourth harmonic blooms out of the hum, doubled loosely and laid on a dark hall.',
    instrument: { deviceId: 'feedback', preset: 'Glass bow', params: { volume: -3, bloom: 0.6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },

  // Staircase: stacked octaves that lean and go on leaning.
  {
    id: 'blue-thirds-leans-and-never-lands',
    name: 'Leans and never lands',
    category: 'pad',
    preview: HELD,
    description:
      'Stacked octaves under a deep chorus, gliding upward so slowly that a held chord leans and never arrives, on a long plate.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Wide drift',
      params: { speed: 0.08, attack: 0.6, release: 2 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate' }],
  },
  {
    id: 'blue-thirds-stairs-with-a-soft-tread',
    name: 'Stairs with a soft tread',
    category: 'organ',
    preview: OPEN,
    description:
      'Reedy octaves that walk up the notes of the held chord, the odd third among them, on a quarter inch reel.',
    instrument: { deviceId: 'staircase', preset: 'Reed stairs' },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5 } }],
  },
  {
    id: 'blue-thirds-down-a-step-to-f',
    name: 'Down a step to F',
    category: 'drone',
    preview: SLOW,
    description:
      'A low stack that sinks without end, breathing open and shut, pressed flat by a dense compressor.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Low tide',
      params: { volume: -13, speed: -0.12, attack: 0.8, release: 3, centre: 180 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath' },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
  },
]
