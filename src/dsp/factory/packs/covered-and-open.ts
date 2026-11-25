import { type FactoryPreset, type Phrase } from '../types'

// A horn with a crook and a hand. A key the tube has is open and bright, any other is made with the
// hand in the bell and darker by what it had to move, so a tune has clear and covered notes by
// arithmetic: on the C crook F4 and A4 are the covered ones. Laid out by crook, then by what is
// played (tune, hunt, duo, chorale, slide, swell), then by what the horn stands in.

// A tune in three: A leans on G and F on E, so on the C crook each downbeat is dark and falls into light.
const SIGHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 60, gain: 0.6 },
    { atSec: 0.42, durSec: 0.4, note: 64, gain: 0.6 },
    { atSec: 0.84, durSec: 0.4, note: 67, gain: 0.65 },
    { atSec: 1.26, durSec: 0.82, note: 69, gain: 0.75 },
    { atSec: 2.1, durSec: 0.4, note: 67, gain: 0.55 },
    { atSec: 2.52, durSec: 0.82, note: 65, gain: 0.7 },
    { atSec: 3.36, durSec: 0.4, note: 64, gain: 0.55 },
    { atSec: 3.78, durSec: 1.2, note: 62, gain: 0.6 },
    { atSec: 5.04, durSec: 1.3, note: 60, gain: 0.55 },
  ],
}
// A hunting call in six on partials 4, 5, 6 and 8 of F, its last bar said again far off.
const HUNT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.38, note: 60, gain: 0.7 },
    { atSec: 0.4, durSec: 0.18, note: 60, gain: 0.6 },
    { atSec: 0.6, durSec: 0.56, note: 65, gain: 0.8 },
    { atSec: 1.2, durSec: 0.38, note: 65, gain: 0.75 },
    { atSec: 1.6, durSec: 0.18, note: 60, gain: 0.6 },
    { atSec: 1.8, durSec: 0.56, note: 57, gain: 0.7 },
    { atSec: 2.4, durSec: 0.38, note: 57, gain: 0.65 },
    { atSec: 2.8, durSec: 0.18, note: 60, gain: 0.6 },
    { atSec: 3, durSec: 0.38, note: 65, gain: 0.8 },
    { atSec: 3.4, durSec: 0.18, note: 60, gain: 0.6 },
    { atSec: 3.6, durSec: 0.38, note: 57, gain: 0.65 },
    { atSec: 4, durSec: 0.18, note: 60, gain: 0.6 },
    { atSec: 4.2, durSec: 0.7, note: 53, gain: 0.7 },
    { atSec: 5.4, durSec: 0.38, note: 57, gain: 0.3 },
    { atSec: 5.8, durSec: 0.18, note: 60, gain: 0.3 },
    { atSec: 6, durSec: 0.6, note: 53, gain: 0.3 },
  ],
}
// A broad call in two that climbs the F tube from its second partial to its eighth: 2, 3, 4, 6, 5, 6, 8.
const SUMMONS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 41, gain: 0.65 },
    { atSec: 1.2, durSec: 0.55, note: 48, gain: 0.65 },
    { atSec: 1.8, durSec: 0.55, note: 53, gain: 0.7 },
    { atSec: 2.4, durSec: 1.1, note: 60, gain: 0.75 },
    { atSec: 3.6, durSec: 0.55, note: 57, gain: 0.6 },
    { atSec: 4.2, durSec: 0.55, note: 60, gain: 0.65 },
    { atSec: 4.8, durSec: 1.6, note: 65, gain: 0.8 },
  ],
}
// Horn fifths in C: sixth, fifth, third and back, then an octave. Every note is on the C tube.
const FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.38, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 0.38, note: 72, gain: 0.65 },
    { atSec: 0.4, durSec: 0.18, note: 67, gain: 0.5 },
    { atSec: 0.4, durSec: 0.18, note: 74, gain: 0.6 },
    { atSec: 0.6, durSec: 0.56, note: 72, gain: 0.55 },
    { atSec: 0.6, durSec: 0.56, note: 76, gain: 0.7 },
    { atSec: 1.2, durSec: 0.38, note: 67, gain: 0.5 },
    { atSec: 1.2, durSec: 0.38, note: 74, gain: 0.6 },
    { atSec: 1.6, durSec: 0.18, note: 64, gain: 0.5 },
    { atSec: 1.6, durSec: 0.18, note: 72, gain: 0.6 },
    { atSec: 1.8, durSec: 0.56, note: 67, gain: 0.55 },
    { atSec: 1.8, durSec: 0.56, note: 74, gain: 0.65 },
    { atSec: 2.4, durSec: 0.38, note: 72, gain: 0.55 },
    { atSec: 2.4, durSec: 0.38, note: 76, gain: 0.7 },
    { atSec: 2.8, durSec: 0.18, note: 67, gain: 0.5 },
    { atSec: 2.8, durSec: 0.18, note: 74, gain: 0.6 },
    { atSec: 3, durSec: 0.38, note: 64, gain: 0.5 },
    { atSec: 3, durSec: 0.38, note: 72, gain: 0.6 },
    { atSec: 3.4, durSec: 0.18, note: 64, gain: 0.45 },
    { atSec: 3.4, durSec: 0.18, note: 67, gain: 0.5 },
    { atSec: 3.6, durSec: 2, note: 60, gain: 0.5 },
    { atSec: 3.6, durSec: 2, note: 72, gain: 0.6 },
  ],
}
// The same fifths slowly, in F over an F two octaves down: sixth, fifth, third, fifth, sixth.
const SLOW_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 1.2, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 1.2, note: 65, gain: 0.6 },
    { atSec: 1.2, durSec: 1.2, note: 60, gain: 0.5 },
    { atSec: 1.2, durSec: 1.2, note: 67, gain: 0.6 },
    { atSec: 2.4, durSec: 1.2, note: 65, gain: 0.5 },
    { atSec: 2.4, durSec: 1.2, note: 69, gain: 0.65 },
    { atSec: 3.6, durSec: 1.2, note: 60, gain: 0.5 },
    { atSec: 3.6, durSec: 1.2, note: 67, gain: 0.6 },
    { atSec: 4.8, durSec: 1.5, note: 57, gain: 0.5 },
    { atSec: 4.8, durSec: 1.5, note: 65, gain: 0.55 },
  ],
}
// A chorale of I, IV, ii, V, I in C, four parts: open at both ends and in shade between on the C crook.
const LIGHT_SHADE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 48, gain: 0.55 },
    { atSec: 0, durSec: 1.25, note: 55, gain: 0.45 },
    { atSec: 0, durSec: 1.25, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.25, note: 72, gain: 0.6 },
    { atSec: 1.3, durSec: 1.25, note: 53, gain: 0.55 },
    { atSec: 1.3, durSec: 1.25, note: 57, gain: 0.45 },
    { atSec: 1.3, durSec: 1.25, note: 65, gain: 0.5 },
    { atSec: 1.3, durSec: 1.25, note: 72, gain: 0.6 },
    { atSec: 2.6, durSec: 1.25, note: 50, gain: 0.55 },
    { atSec: 2.6, durSec: 1.25, note: 57, gain: 0.45 },
    { atSec: 2.6, durSec: 1.25, note: 65, gain: 0.5 },
    { atSec: 2.6, durSec: 1.25, note: 74, gain: 0.6 },
    { atSec: 3.9, durSec: 1.25, note: 43, gain: 0.55 },
    { atSec: 3.9, durSec: 1.25, note: 59, gain: 0.45 },
    { atSec: 3.9, durSec: 1.25, note: 67, gain: 0.5 },
    { atSec: 3.9, durSec: 1.25, note: 74, gain: 0.6 },
    { atSec: 5.2, durSec: 1.4, note: 48, gain: 0.55 },
    { atSec: 5.2, durSec: 1.4, note: 60, gain: 0.45 },
    { atSec: 5.2, durSec: 1.4, note: 67, gain: 0.5 },
    { atSec: 5.2, durSec: 1.4, note: 76, gain: 0.6 },
  ],
}
// Held keys a tenth apart that overlap, up and part of the way back: what a lip slide is made of.
const TENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 60, gain: 0.65 },
    { atSec: 1.3, durSec: 3.2, note: 76, gain: 0.75 },
    { atSec: 4.1, durSec: 2.4, note: 67, gain: 0.6 },
  ],
}
// The chord of C from the top, each key held into the next.
const DOWN_THE_CHORD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 72, gain: 0.7 },
    { atSec: 1.1, durSec: 1.4, note: 67, gain: 0.65 },
    { atSec: 2.2, durSec: 1.4, note: 64, gain: 0.6 },
    { atSec: 3.3, durSec: 1.4, note: 60, gain: 0.6 },
    { atSec: 4.4, durSec: 2, note: 55, gain: 0.65 },
  ],
}
// Two long fifths, C and F: on the C crook the first is open and the second has its root in the hand.
const TWO_SWELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 48, gain: 0.65 },
    { atSec: 0, durSec: 3.1, note: 55, gain: 0.6 },
    { atSec: 3.3, durSec: 3.1, note: 53, gain: 0.65 },
    { atSec: 3.3, durSec: 3.1, note: 60, gain: 0.6 },
  ],
}
// A low tune in D minor: on the low B flat crook D and F ring and A, G and E are the hand's.
const LOW_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 50, gain: 0.65 },
    { atSec: 1, durSec: 0.95, note: 57, gain: 0.75 },
    { atSec: 2, durSec: 0.48, note: 55, gain: 0.6 },
    { atSec: 2.5, durSec: 0.48, note: 53, gain: 0.6 },
    { atSec: 3, durSec: 0.48, note: 52, gain: 0.55 },
    { atSec: 3.5, durSec: 0.48, note: 53, gain: 0.6 },
    { atSec: 4, durSec: 2, note: 50, gain: 0.65 },
  ],
}
// A call on C, its answer softly on D minor, the call again a step of the chord higher.
const ANSWERED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.38, note: 60, gain: 0.75 },
    { atSec: 0.4, durSec: 0.38, note: 64, gain: 0.75 },
    { atSec: 0.8, durSec: 1, note: 67, gain: 0.8 },
    { atSec: 2.2, durSec: 0.38, note: 62, gain: 0.4 },
    { atSec: 2.6, durSec: 0.38, note: 65, gain: 0.4 },
    { atSec: 3, durSec: 1.2, note: 69, gain: 0.45 },
    { atSec: 4.5, durSec: 0.38, note: 64, gain: 0.65 },
    { atSec: 4.9, durSec: 0.38, note: 67, gain: 0.65 },
    { atSec: 5.3, durSec: 1.2, note: 72, gain: 0.7 },
  ],
}
// Two parts in thirds that climb into F and A and come home by B and D.
const THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.48, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 0.48, note: 64, gain: 0.6 },
    { atSec: 0.5, durSec: 0.48, note: 62, gain: 0.55 },
    { atSec: 0.5, durSec: 0.48, note: 65, gain: 0.6 },
    { atSec: 1, durSec: 0.48, note: 64, gain: 0.55 },
    { atSec: 1, durSec: 0.48, note: 67, gain: 0.65 },
    { atSec: 1.5, durSec: 0.98, note: 65, gain: 0.6 },
    { atSec: 1.5, durSec: 0.98, note: 69, gain: 0.7 },
    { atSec: 2.5, durSec: 0.48, note: 64, gain: 0.55 },
    { atSec: 2.5, durSec: 0.48, note: 67, gain: 0.6 },
    { atSec: 3, durSec: 0.98, note: 62, gain: 0.55 },
    { atSec: 3, durSec: 0.98, note: 65, gain: 0.6 },
    { atSec: 4, durSec: 0.48, note: 59, gain: 0.5 },
    { atSec: 4, durSec: 0.48, note: 62, gain: 0.55 },
    { atSec: 4.5, durSec: 1.7, note: 60, gain: 0.55 },
    { atSec: 4.5, durSec: 1.7, note: 64, gain: 0.6 },
  ],
}
// The second and third partials of the C crook, held.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 36, gain: 0.6 },
    { atSec: 0.6, durSec: 5.6, note: 43, gain: 0.5 },
  ],
}
// C held in the bass and on top while E and G step up into F and A, the covered pair, and back.
const PLAGAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 72, gain: 0.4 },
    { atSec: 0, durSec: 2.1, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 2.1, note: 64, gain: 0.5 },
    { atSec: 2.1, durSec: 2.1, note: 57, gain: 0.55 },
    { atSec: 2.1, durSec: 2.1, note: 65, gain: 0.55 },
    { atSec: 4.2, durSec: 2.2, note: 55, gain: 0.5 },
    { atSec: 4.2, durSec: 2.2, note: 64, gain: 0.5 },
  ],
}
// Horn fifths for the fingers: a bass note for the thumb, then the pair above it.
const THUMB_AND_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 48, gain: 0.6 },
    { atSec: 0.3, durSec: 0.85, note: 64, gain: 0.5 },
    { atSec: 0.3, durSec: 0.85, note: 72, gain: 0.6 },
    { atSec: 1.2, durSec: 1.1, note: 43, gain: 0.6 },
    { atSec: 1.5, durSec: 0.85, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 0.85, note: 74, gain: 0.6 },
    { atSec: 2.4, durSec: 1.1, note: 48, gain: 0.6 },
    { atSec: 2.7, durSec: 0.85, note: 72, gain: 0.5 },
    { atSec: 2.7, durSec: 0.85, note: 76, gain: 0.65 },
    { atSec: 3.6, durSec: 1.1, note: 43, gain: 0.6 },
    { atSec: 3.9, durSec: 0.85, note: 67, gain: 0.5 },
    { atSec: 3.9, durSec: 0.85, note: 74, gain: 0.6 },
    { atSec: 4.8, durSec: 1.7, note: 48, gain: 0.6 },
    { atSec: 5.1, durSec: 1.4, note: 64, gain: 0.5 },
    { atSec: 5.1, durSec: 1.4, note: 72, gain: 0.55 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // The tune of two sighs on one crook after another.
  {
    id: 'covered-and-open-leans-into-light',
    name: 'Leans into light',
    category: 'wind',
    description:
      'The C crook close up: A and F are covered, G and E under them open, so each sigh goes from dark to bright, in a tight chamber.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hand on the C crook',
      params: { shadow: 0.9, blow: 0.8, breath: 0.2, attack: 0.03, release: 0.6, distance: 0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'covered-and-open-sighs-turned-round',
    name: 'Sighs turned round',
    category: 'wind',
    description:
      'On the low B flat crook A and F are open, the G and E they fall to in the hand: bright, then dark, a few steps off on a dark plate.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Basso crook',
      params: { volume: 1.5, blow: 0.5, shadow: 1, attack: 0.28, release: 1.6, breath: 0.15 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'covered-and-open-thin-seventh-partial',
    name: 'Thin seventh partial',
    category: 'wind',
    description:
      'On the D crook the tune starts on the seventh partial, lipped up and thin; D, E and A are open, F and G covered. A warm spring behind.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Across the water',
      params: { distance: 0.1, blow: 0.6, breath: 0.9, attack: 0.09, release: 0.4, spread: 0.3 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Narrow warm tank' }],
  },
  {
    id: 'covered-and-open-e-flat-in-full-brass',
    name: 'E flat in full brass',
    category: 'wind',
    description:
      'The E flat crook blown hard through a glowing triode: only G and F are open, the rest stopped small and nasal, in a tight plate room.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Blown to brass',
      params: { attack: 0.07, release: 0.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'covered-and-open-home-note-stopped',
    name: 'Home note stopped',
    category: 'wind',
    description:
      'On the G crook A, G, F and D are open, E half stopped and the C it starts and ends on fully, on a cassette.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Wide lips',
      params: {
        lip: 35,
        shadow: 1,
        blow: 0.65,
        breath: 0.4,
        attack: 0.15,
        release: 0.7,
        distance: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'covered-and-open-stones-after-a-rip',
    name: 'Stones after a rip',
    category: 'wind',
    description:
      'On the A crook every note scoops up with a crack; C is stopped, D and F fully, and soft echoes skip away after each.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Rough start',
      params: { rip: 0.5, blow: 0.6, breath: 0.25, attack: 0.02, release: 0.5, distance: 0 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Sinking away', params: { mix: 0.3 } }],
  },
  {
    id: 'covered-and-open-mitten-in-the-bell',
    name: 'Mitten in the bell',
    category: 'wind',
    description:
      'On the A flat crook with stiff lips no note of the tune is open: a small nasal horn heard from inside a big shell.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'All in the hand',
      params: { volume: 2.5, blow: 1, breath: 0.1, attack: 0.05, release: 0.3 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Shell to the ear' }],
  },
  {
    id: 'covered-and-open-two-steps-covered',
    name: 'Two steps covered',
    category: 'wind',
    description:
      'The F crook, softly tongued: C, F, G and A are open, D and E are in the hand, with a faint chorus in a long church.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Crook in F',
      params: { blow: 0.45, attack: 0.3, release: 1.4, spread: 0.6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'covered-and-open-horn-at-a-kitchen-window',
    name: 'Horn at a kitchen window',
    category: 'wind',
    description:
      'The B flat alto crook on a kitchen radio: D and F ring, C is fully stopped and E, G and A are in the hand.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Alto crook',
      params: { crook: 9, blow: 0.8, shadow: 1, breath: 0.3, attack: 0.02 },
    },
    effects: [{ deviceId: 'patina', preset: 'Kitchen radio' }],
  },
  {
    id: 'covered-and-open-under-the-alto-tube',
    name: 'Under the alto tube',
    category: 'wind',
    description:
      'On the alto C crook C, E and G are partials four to six, D and F fully stopped and A about half, slowly tongued with a late vibrato.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Alto crook',
      params: {
        volume: 0.5,
        blow: 0.9,
        shadow: 1,
        attack: 0.18,
        release: 0.8,
        spread: 0.7,
        distance: 0.4,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'covered-and-open-ford-at-dusk',
    name: 'Ford at dusk',
    category: 'wind',
    description:
      'On the E crook only E is open and D, thin, beside it; the rest is dark, breathy, unsteady in the hand and half under water.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Dark corner',
      params: { crook: 4, attack: 0.2, release: 1, tremble: 0.45, trembleRate: 1.6 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Half in' }],
  },
  {
    id: 'covered-and-open-lips-do-it-all',
    name: 'Lips do it all',
    category: 'wind',
    description:
      'Lip at sixty on the C crook: F is lipped down and A lipped up, thin, and the hand never comes in. Wide ensemble and a short blur.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Wide lips',
      params: {
        crook: 1,
        blow: 0.85,
        breath: 0.1,
        attack: 0.01,
        release: 0.15,
        distance: 0,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'covered-and-open-wild-eleventh',
    name: 'Wild eleventh',
    category: 'wind',
    description:
      'No hand on the C crook: F comes out as the eleventh partial, a quarter tone sharp, and A as the thirteenth, flat, on a bright plate.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Open tube only',
      params: { blow: 0.3, breath: 0.35, attack: 0.05, release: 0.7, spread: 0 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate' }],
  },
  {
    id: 'covered-and-open-hand-halfway-home',
    name: 'Hand halfway home',
    category: 'wind',
    description:
      'The hand only half in on the C crook: F stays some 25 cents sharp and A 30 flat, half covered, with a chorused echo.',
    preview: SIGHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Half a hand',
      params: { crook: 1, attack: 0.12, release: 0.9, blow: 0.4, breath: 0, spread: 0.2 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Chorused' }],
  },
  // Hunting calls.
  {
    id: 'covered-and-open-draw-the-covert',
    name: 'Draw the covert',
    category: 'wind',
    description:
      'The call on its own crook, F: all its notes are partials four to eight, open, lightly ripped, with hard echoes off a wood.',
    preview: HUNT,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hunting call',
      params: { crook: 5, rip: 0.2, breath: 0, distance: 0.1 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Hard echoes' }],
  },
  {
    id: 'covered-and-open-wrong-crook-for-it',
    name: 'Wrong crook for it',
    category: 'wind',
    description:
      'The F call on the C crook with the hand at work: C is open, F and A covered and the low F fully stopped, with one tape slap.',
    preview: HUNT,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hunting call',
      params: {
        hand: 1,
        crook: 1,
        shadow: 1,
        rip: 0,
        attack: 0.03,
        blow: 0.75,
        breath: 0.6,
        distance: 0,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap' }],
  },
  {
    id: 'covered-and-open-beyond-the-firs',
    name: 'Beyond the firs',
    category: 'wind',
    description:
      'A far horn on the F crook climbing its own partials two to eight, all open, pushed farther off by a second distance.',
    preview: SUMMONS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Far horn',
      params: { crook: 5, attack: 0.02, release: 0.4, blow: 1, spread: 0.3 },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
  },
  {
    id: 'covered-and-open-scooped-from-below',
    name: 'Scooped from below',
    category: 'wind',
    description:
      'A rip at full on the low B flat crook: each note leaps up from the next lower partial, the first by a fifth. One far echo.',
    preview: SUMMONS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Basso crook',
      params: { volume: -1.5, rip: 1, attack: 0.02, release: 0.15, breath: 0.1 },
    },
    effects: [{ deviceId: 'constellation', preset: 'One far star' }],
  },
  {
    id: 'covered-and-open-frost-in-the-throat',
    name: 'Frost in the throat',
    category: 'wind',
    description:
      'A cracked, airy climb on the F crook, its first note torn up from an octave under, squashed by a limiter, with a dripping spring.',
    preview: SUMMONS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Rough start',
      params: { crook: 5, breath: 1, blow: 0.5, release: 0.1, distance: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'covered-and-open-ducks-go-up',
    name: 'Ducks go up',
    category: 'wind',
    description:
      'A call over water on the D crook: A is open, C thin, F covered; echoes land slower and slower as they cross.',
    preview: HUNT,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Across the water',
      params: { distance: 0.45, breath: 0.1, blow: 0.75, spread: 0.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.5 } }],
  },
  {
    id: 'covered-and-open-post-horn-in-the-lane',
    name: 'Post horn in the lane',
    category: 'wind',
    description:
      'A short alto B flat tube, blown full and cut off short: F is open, C and A are in the hand. A slap comes off the hedge.',
    preview: HUNT,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Quick lip slurs',
      params: {
        crook: 9,
        slide: 0.05,
        attack: 0.005,
        release: 0.05,
        blow: 1,
        breath: 0,
        shadow: 1,
        distance: 0,
      },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slapback' }],
  },
  {
    id: 'covered-and-open-tube-decides',
    name: 'Tube decides',
    category: 'wind',
    description:
      'No hand on the alto C tube: F falls to E, A and low F to G, so a call in F comes out in C, its colours fanned apart in time.',
    preview: HUNT,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Open tube only',
      params: { crook: 10, blow: 0.7, attack: 0.03, release: 0.6, spread: 0.4, distance: 0.1 },
    },
    effects: [{ deviceId: 'prism', preset: 'High to low', params: { mix: 0.45 } }],
  },
  {
    id: 'covered-and-open-second-huntsman',
    name: 'Second huntsman',
    category: 'wind',
    description:
      'A call on the F crook without rip, and another horn that follows two beats late and dull, both cut thin.',
    preview: HUNT,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Crook in F',
      params: { blow: 1, attack: 0.015, release: 0.2, breath: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Mirror answer',
        params: { gap: 1.2, crab: 0, tone: 1500, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  // Two horns: fifths and thirds.
  {
    id: 'covered-and-open-fifths-in-full-sun',
    name: 'Fifths in full sun',
    category: 'wind',
    description:
      'Two horns set apart on one C crook: sixth, fifth, third, every note of it open, in a bright chamber with a wide top.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Two horns apart',
      params: { crook: 1, blow: 1, attack: 0.02, release: 0.2, breath: 0, distance: 0 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Bright chamber' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'covered-and-open-two-without-hands',
    name: 'Two without hands',
    category: 'wind',
    description:
      "A pair on the alto C crook at the tube's own pitch, partials four to ten but the seventh: the third low and pure, barely roomed.",
    preview: FIFTHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Open tube only',
      params: { crook: 10, blow: 0.3, attack: 0.06, release: 0.3, spread: 1, breath: 0.1 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
  },
  {
    id: 'covered-and-open-thirds-climb-into-shade',
    name: 'Thirds climb into shade',
    category: 'wind',
    description:
      'Two horns on the C crook in thirds: the highest pair, F and A, is all in the hand, and so is the B before the close. Slow phasing.',
    preview: THIRDS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Two horns apart',
      params: {
        volume: -0.5,
        crook: 1,
        shadow: 1,
        blow: 0.45,
        attack: 0.18,
        release: 0.6,
        distance: 0.3,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'covered-and-open-thirds-out-of-the-hand',
    name: 'Thirds out of the hand',
    category: 'wind',
    description:
      'The same thirds on the F crook: B, D and E are covered, C, F, G and A open, turned by the drum of a rotary speaker.',
    preview: THIRDS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Crook in F',
      params: { blow: 0.65, shadow: 1, attack: 0.1, release: 0.5, breath: 0, spread: 0.9 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
  },
  {
    id: 'covered-and-open-valley-floor-on-f',
    name: 'Valley floor on F',
    category: 'wind',
    description:
      'Horns on the F crook swell for over half a second on horn fifths over a low F, every note open, in a valley that lasts ten seconds.',
    preview: SLOW_FIFTHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Crook in F',
      params: { attack: 0.7, release: 2.2, spread: 0.8, blow: 0.7, distance: 0.25 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley' }],
  },
  {
    id: 'covered-and-open-fifths-behind-a-hand',
    name: 'Fifths behind a hand',
    category: 'wind',
    description:
      'The slow fifths on the C crook: C and G are open, both Fs and As covered, their starts taken off by a thick fog.',
    preview: SLOW_FIFTHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Dark corner',
      params: {
        volume: -5.5,
        crook: 1,
        attack: 0.3,
        release: 1.2,
        tremble: 0,
        breath: 0.2,
        distance: 0.1,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank' }],
  },
  {
    id: 'covered-and-open-two-hummed-parts',
    name: 'Two hummed parts',
    category: 'wind',
    description:
      'Two horns on the D crook blown so low that they hum, pitched a few cents apart left and right, with nothing but a little air.',
    preview: THIRDS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Round hum',
      params: { crook: 2, attack: 0.08, release: 0.35, shadow: 1, spread: 0.5 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Thickener', params: { width: 1, mix: 0.5 } }],
  },
  {
    id: 'covered-and-open-more-air-than-fifths',
    name: 'More air than fifths',
    category: 'wind',
    description:
      'Mostly breath in a C tube, horn fifths just heard inside it, while wind leans on them and lets go.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Air in the tube',
      params: { crook: 1, attack: 0.1, release: 0.6, blow: 0.2 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day' }],
  },
  {
    id: 'covered-and-open-duo-over-the-quarry',
    name: 'Duo over the quarry',
    category: 'wind',
    description:
      'Two far horns on the D crook, G in the hand and C thin, while the quarry sends their notes back at scattered moments.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Far horn',
      params: { crook: 2, distance: 0.75, attack: 0.03, release: 0.25, spread: 1, blow: 0.85 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven' }],
  },
  // Chorales.
  {
    id: 'covered-and-open-shade-in-the-middle',
    name: 'Shade in the middle',
    category: 'wind',
    description:
      'Four horns on the C crook: the first and last chords are all open, F and D minor nearly all in the hand, in a cathedral.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hand on the C crook',
      params: { shadow: 1, attack: 0.15, release: 0.9, spread: 0.7, blow: 0.75, breath: 0.1 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral' }],
  },
  {
    id: 'covered-and-open-lamp-on-the-fourth',
    name: 'Lamp on the fourth',
    category: 'wind',
    description:
      'The chorale on the F crook: now the chord of F and the last chord are the ones with every note open. A long plate carries it.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'One colour',
      params: { crook: 5, shadow: 1, blow: 0.6, attack: 0.4, release: 1.2, breath: 0.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate' }],
  },
  {
    id: 'covered-and-open-window-on-the-dominant',
    name: 'Window on the dominant',
    category: 'wind',
    description:
      'Four parts on the G crook: all of the G chord is open and most of the rest stopped, in a small space that sings one vowel.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Wide lips',
      params: {
        volume: -11.5,
        lip: 35,
        shadow: 1,
        blow: 0.3,
        breath: 0,
        attack: 0.25,
        release: 0.6,
        distance: 0.1,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Lone voice' }],
  },
  {
    id: 'covered-and-open-shade-taken-away',
    name: 'Shade taken away',
    category: 'wind',
    description:
      'Shadow at nothing on the C crook, so stopped and open keys have one colour; a wide flock of copies drifts about the chorale.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'One colour',
      params: { crook: 1, blow: 0.5, attack: 0.1, release: 0.4, spread: 1 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble' }],
  },
  {
    id: 'covered-and-open-hummed-benediction',
    name: 'Hummed benediction',
    category: 'pad',
    description:
      'Horns on the B flat alto crook, hummed with a slow start: only F, high C and D are open. A string pad swells up behind.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Round hum',
      params: { attack: 0.5, release: 2, breath: 0.2, spread: 0.8, distance: 0.3 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Slow swell' }],
  },
  {
    id: 'covered-and-open-chorale-out-of-true',
    name: 'Chorale out of true',
    category: 'pad',
    description:
      'A hand not quite home on the E flat crook: covered notes stay up to sixty cents off, so the chords lean, smeared into a hanging mist.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Half a hand',
      params: { hand: 0.8, lip: 5, attack: 0.3, release: 1, blow: 0.8, breath: 0.1 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist' }],
  },
  {
    id: 'covered-and-open-brass-from-the-tower',
    name: 'Brass from the tower',
    category: 'wind',
    description:
      'The C crook blown to brass in four parts, levelled by a slow compressor and pushed through a console, close by on a small plate.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Blown to brass',
      params: { crook: 1, attack: 0.12, release: 0.35, spread: 0.6, shadow: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'covered-and-open-under-the-cellar-door',
    name: 'Under the cellar door',
    category: 'wind',
    description:
      'Horn fifths on the low B flat crook: Fs, C and top A open, G and low A in the hand, an octave added beneath, in a dark cave.',
    preview: SLOW_FIFTHS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Basso crook',
      params: { blow: 0.7, attack: 0.3, release: 1, breath: 0.1, shadow: 1, spread: 0.6 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'covered-and-open-breath-that-has-a-chord',
    name: 'Breath that has a chord',
    category: 'texture',
    description:
      'Air in an F tube, stacked in four parts and passed through a filter that lets only the notes of C major by, so the breath has a key.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Air in the tube',
      params: { crook: 5, attack: 0.5, release: 2, spread: 1 },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'In a major key' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'covered-and-open-village-over-there',
    name: 'Village over there',
    category: 'wind',
    description:
      "A far chorale on the C crook whose phrases go into a room and come back, each pass nearer to the room's own tones.",
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Far horn',
      params: { crook: 1, attack: 0.5, release: 1.2, distance: 0.7, breath: 0 },
    },
    effects: [{ deviceId: 'generations', preset: 'Slow dissolve' }],
  },
  // Lip slides: one horn, keys held into each other, and every partial of the tube on the way.
  {
    id: 'covered-and-open-rungs-near-the-ear',
    name: 'Rungs near the ear',
    category: 'wind',
    description:
      'One horn on the C crook, close and full: held keys are joined by a ladder of open notes, over a second to climb, dry but for a booth.',
    preview: TENTH,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Ladder of a tenth',
      params: { slide: 1.3, attack: 0.03, release: 0.3, breath: 0.1, distance: 0, spread: 0 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
  },
  {
    id: 'covered-and-open-tumble-down-the-tube',
    name: 'Tumble down the tube',
    category: 'wind',
    description:
      'A chord of C let down key into key on the F crook, its E and low G in the hand, open rungs between, and a galloping tape.',
    preview: DOWN_THE_CHORD,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Quick lip slurs',
      params: { slide: 0.6, release: 0.4, shadow: 1, blow: 0.75 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop' }],
  },
  {
    id: 'covered-and-open-rungs-set-wide-apart',
    name: 'Rungs set wide apart',
    category: 'wind',
    description:
      'On the alto C tube a tenth has only five rungs to pass: a soft horn takes two seconds over them, with rising choirs behind.',
    preview: TENTH,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Slow climb at dusk',
      params: { crook: 10, slide: 2.1, attack: 0.3, release: 1.5, distance: 0.2 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Late answer', params: { mix: 0.3 } }],
  },
  {
    id: 'covered-and-open-basso-staircase',
    name: 'Basso staircase',
    category: 'wind',
    description:
      'One low B flat horn sliding a second at a time down the chord, where partials lie close, into three loops that turn out of step.',
    preview: DOWN_THE_CHORD,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Basso crook',
      params: { play: 0, slide: 1, attack: 0.06, release: 0.5, breath: 0.7, blow: 0.8 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Out of step' }],
  },
  {
    id: 'covered-and-open-hum-on-a-ladder',
    name: 'Hum on a ladder',
    category: 'wind',
    description:
      'A hummed C horn gliding by its partials, and moments of what it did drifting back later out of a long memory.',
    preview: TENTH,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Round hum',
      params: { volume: -2, play: 0, crook: 1, slide: 1.8, attack: 0.35, release: 1, spread: 0 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Hazy past' }],
  },
  {
    id: 'covered-and-open-torn-slur',
    name: 'Torn slur',
    category: 'wind',
    description:
      'A horn on the C crook that cracks into its first key and then slurs, half a second at a time, with its past played backwards.',
    preview: DOWN_THE_CHORD,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Rough start',
      params: { play: 0, crook: 1, slide: 0.5, rip: 0.7, blow: 1, breath: 0.2, release: 0.6 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo' }],
  },
  {
    id: 'covered-and-open-climb-past-earshot',
    name: 'Climb past earshot',
    category: 'wind',
    description:
      'A far solo on the G crook sliding for a second and a half; pieces of it rise in pitch as they fade, like mist off a slope.',
    preview: TENTH,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Far horn',
      params: { play: 0, crook: 6, slide: 1.5, distance: 0.6, release: 0.8, blow: 0.9 },
    },
    effects: [{ deviceId: 'falling', preset: 'Rising mist' }],
  },
  {
    id: 'covered-and-open-dark-ends-bright-way',
    name: 'Dark ends, bright way',
    category: 'wind',
    description:
      'On the A flat crook with stiff lips C and G are in the hand and E a little, but the slides between are open rungs; sines swell in.',
    preview: TENTH,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'All in the hand',
      params: { play: 0, slide: 1.2, attack: 0.1, release: 1.4, breath: 0, distance: 0.2 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Sine shadow' }],
  },
  // Long swells.
  {
    id: 'covered-and-open-tide-of-brass',
    name: 'Tide of brass',
    category: 'pad',
    description:
      'Fifths on the C crook that take two seconds to turn brassy; the second has its root in the hand. Strings in C ring with them.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Long swell',
      params: { crook: 1, attack: 1.9, release: 1.5, blow: 1, shadow: 1, breath: 0.1 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.4 } }],
  },
  {
    id: 'covered-and-open-shutter-opened',
    name: 'Shutter opened',
    category: 'pad',
    description:
      'On the low B flat crook the fifth on C is all hand and the fifth on F all open: a dark swell, then a bright one, in the far nave.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Basso crook',
      params: { attack: 1, release: 1.8, blow: 0.9, shadow: 1, breath: 0.05, spread: 0.8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } }],
  },
  {
    id: 'covered-and-open-no-window-at-all',
    name: 'No window at all',
    category: 'drone',
    description:
      'All four keys of two fifths are stopped on the A crook: a low nasal glow that rises slowly and never lights, on seasick tape in thin air.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Dark corner',
      params: {
        crook: 8,
        attack: 1.4,
        release: 1.5,
        breath: 0.3,
        blow: 1,
        distance: 0,
        tremble: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'expanse', preset: 'Thin air' },
    ],
  },
  {
    id: 'covered-and-open-asleep-in-the-bell',
    name: 'Asleep in the bell',
    category: 'pad',
    description:
      'A hum on the F crook in short breaths: the outer Cs are open, and the inner pair is dark until it steps up into F and A.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Round hum',
      params: { crook: 5, attack: 0.9, release: 2.2, breath: 0.4, spread: 1 },
    },
    effects: [{ deviceId: 'breath', preset: 'Short of breath' }],
  },
  {
    id: 'covered-and-open-wind-finds-a-note',
    name: 'Wind finds a note',
    category: 'texture',
    description:
      'More breath than tone on the A flat crook, only the C on top open, its bands swelling each on a tide of its own.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Air in the tube',
      params: { crook: 7, attack: 1.8, release: 2.5, blow: 0.4, shadow: 1 },
    },
    effects: [{ deviceId: 'currents', preset: 'Breaking waves' }],
  },
  {
    id: 'covered-and-open-inner-pair-goes-dim',
    name: 'Inner pair goes dim',
    category: 'pad',
    description:
      'Four C horns swell for a second: C stands still in two octaves while E and G step up into the dimmer F and A and back, among bowls.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Slow hand wave',
      params: { tremble: 0, attack: 1, release: 1.4, blow: 0.5, breath: 0, spread: 0.4 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Long ring' }],
  },
  {
    id: 'covered-and-open-swell-turned-backwards',
    name: 'Swell turned backwards',
    category: 'pad',
    description:
      'Fifths on the G crook, all stopped but one, and a reverb that rises for four seconds behind each and is cut.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Blown to brass',
      params: { volume: -0.5, crook: 6, attack: 0.8, release: 0.4, blow: 0.7 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Long rise' }],
  },
  {
    id: 'covered-and-open-held-after-the-hand',
    name: 'Held after the hand',
    category: 'drone',
    description:
      'Each swell on the D crook is caught and held as an even pad that glides to the next, while the horn itself lets go.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'One colour',
      params: { volume: -1, attack: 0.6, release: 0.5, blow: 0.15, shadow: 0.7, distance: 0.4 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings' }],
  },
  // The hand that trembles, the low tube, and calls with their answers.
  {
    id: 'covered-and-open-fluttering-glove',
    name: 'Fluttering glove',
    category: 'wind',
    description:
      'A hand that opens and closes seven times a second on the F crook, pitch and colour together, under faint glitter.',
    preview: ANSWERED,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hand tremble',
      params: {
        volume: -2,
        crook: 5,
        trembleRate: 7,
        attack: 0.04,
        release: 0.4,
        breath: 0,
        blow: 0.9,
      },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'covered-and-open-waved-like-a-lantern',
    name: 'Waved like a lantern',
    category: 'wind',
    description:
      'A slow hand, one wave in a second and a half, on the E flat crook: the light swings on open and covered notes alike, on a wide pendulum.',
    preview: ANSWERED,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Slow hand wave',
      params: {
        volume: 1.5,
        crook: 3,
        trembleRate: 0.7,
        attack: 0.12,
        release: 0.9,
        blow: 1,
        distance: 0,
      },
    },
    effects: [{ deviceId: 'around', preset: 'Wide pendulum' }],
  },
  {
    id: 'covered-and-open-tune-for-the-low-crook',
    name: 'Tune for the low crook',
    category: 'wind',
    description:
      'A low tune on the B flat basso crook: D and F ring, A, G and E are in the hand, thickened by an iron transformer under a faint halo.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Basso crook',
      params: { attack: 0.06, release: 0.3, breath: 0.25, blow: 0.9, shadow: 0.6, distance: 0.05 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'covered-and-open-horn-of-the-peat-bank',
    name: 'Horn of the peat bank',
    category: 'wind',
    description:
      'A low breathy horn on the D crook: D and A are open, E and G fully stopped, its body made larger, in a long dull spring tank.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Wide lips',
      params: { crook: 2, lip: 35, breath: 1, attack: 0.2, release: 1.2, blow: 0.6, shadow: 1 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'covered-and-open-answer-in-the-hand',
    name: 'Answer in the hand',
    category: 'wind',
    description:
      'On the C crook the call is open and its answer, with F and A, half covered; a slow dark bucket-brigade echo keeps both.',
    preview: ANSWERED,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Across the water',
      params: {
        crook: 1,
        shadow: 1,
        distance: 0.2,
        attack: 0.05,
        release: 0.25,
        blow: 1,
        breath: 0,
      },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky' }],
  },
  {
    id: 'covered-and-open-answer-from-a-clearing',
    name: 'Answer from a clearing',
    category: 'wind',
    description:
      'The same words on the low B flat crook: E and G of the call are stopped and the answer, D, F and A, is the open one. Lost on shortwave.',
    preview: ANSWERED,
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hand on the C crook',
      params: {
        volume: 1,
        crook: 0,
        shadow: 1,
        attack: 0.1,
        release: 1.3,
        blow: 0.6,
        breath: 0.5,
        distance: 0.4,
      },
    },
    effects: [{ deviceId: 'radio', preset: 'Night shortwave' }],
  },
  // What a horn stands in: a brass section, where nothing is covered, and the same tunes.
  {
    id: 'covered-and-open-valves-in-place-of-hands',
    name: 'Valves in place of hands',
    category: 'wind',
    description:
      'A pair of horns with valves on the same thirds: every degree has one colour now, with a sheen of drive in a room that slaps.',
    preview: THIRDS,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.03, release: 0.2, blow: 0.9, breath: 0, section: 0.35, vibrato: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'covered-and-open-ring-of-hunters',
    name: 'Ring of hunters',
    category: 'wind',
    description:
      'A full section of trumpets on the call, quick and hard, turned slowly in a rotary cabinet across the room.',
    preview: HUNT,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { volume: -1.5, attack: 0.03, release: 0.25, blow: 0.85 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'covered-and-open-chorale-in-loden',
    name: 'Chorale in loden',
    category: 'pad',
    description:
      'A flugelhorn choir in four soft parts, each broad band of it swelling slowly by itself, under a warm low hall.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.4, release: 1.2, blow: 0.3, breath: 0.4 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Broad swells' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'covered-and-open-mute-instead-of-a-hand',
    name: 'Mute instead of a hand',
    category: 'wind',
    description:
      'Muted trumpets swell on the sighing tune, every note as nasal as a stopped one, muffled, and two tape decks start it over at its end.',
    preview: SIGHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: 6, attack: 0.22, release: 0.6, blow: 0.55 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { length: 5.04 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'covered-and-open-a-fifth-to-every-call',
    name: 'A fifth to every call',
    category: 'wind',
    description:
      'A soft solo trumpet that carries its own parallel fifth, calling and answering into slow sparks two octaves up.',
    preview: ANSWERED,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: { volume: -1, attack: 0.06, release: 0.6, breath: 0.3, blow: 0.4 },
    },
    effects: [{ deviceId: 'glints', preset: 'Slow stars' }],
  },
  {
    id: 'covered-and-open-slow-brass-hinge',
    name: 'Slow brass hinge',
    category: 'pad',
    description:
      'Low brass rising for a second and a half on the two fifths, sagging in pitch as its tail ages and darkens.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 1.4, release: 2.5, blow: 0.7, volume: -3.5 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax' }],
  },
  {
    id: 'covered-and-open-breath-of-the-hounds',
    name: 'Breath of the hounds',
    category: 'texture',
    description:
      'French horns that are nearly all air, with slow starts, sifted so that the breath comes forward and wide, with an oo behind.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { volume: -7.5, attack: 0.5, release: 1.8, section: 1 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'covered-and-open-slide-under-the-tune',
    name: 'Slide under the tune',
    category: 'wind',
    description:
      'A low brass solo on the tune of the B flat crook, followed every two seconds by a round: at pitch, a fifth up, an octave down.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { volume: -0.5, blow: 0.5, attack: 0.07, release: 0.8, vibrato: 0.1 },
    },
    effects: [{ deviceId: 'canon', preset: 'Canon at the fifth', params: { gap: 2, mix: 0.35 } }],
  },
  // Tape sections.
  {
    id: 'covered-and-open-reel-of-the-hunt',
    name: 'Reel of the hunt',
    category: 'wind',
    description:
      'Horns off a fairly steady tape playing the call, their fast starts kept, in a three spring tank.',
    preview: HUNT,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.01, release: 0.2, players: 0.2, age: 0.2, vibrato: 0, hiss: 0.1 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring' }],
  },
  {
    id: 'covered-and-open-fifths-at-half-reel',
    name: 'Fifths at half reel',
    category: 'pad',
    description:
      'Tape horns at half speed, so an octave lower, on slow horn fifths over a low F, with a cloud that plays them three times slower.',
    preview: SLOW_FIFTHS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { attack: 0.15, release: 1.2, tone: 0.5 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Near shadow' }],
  },
  {
    id: 'covered-and-open-flutes-keep-the-open',
    name: 'Flutes keep the open',
    category: 'wind',
    description:
      'Still tape flutes with no wear and no vibrato on horn fifths, hopping to the octave in their echoes.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.02, release: 0.3 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 400, mix: 0.3 } }],
  },
  {
    id: 'covered-and-open-reeds-take-the-covered',
    name: 'Reeds take the covered',
    category: 'wind',
    description:
      'Bright tape reeds, nasal as a hand in the bell, in four part chords, held in a wooden body.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: { speed: 0, attack: 0.12, release: 0.6, players: 0.4, vibrato: 0.5 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body' }],
  },
  {
    id: 'covered-and-open-cellos-under-the-crooks',
    name: 'Cellos under the crooks',
    category: 'string',
    description:
      'A cello section on tape playing the low tune, each note beginning straight and swaying more the longer it is held.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { volume: -2, attack: 0.08, release: 0.6, vibrato: 0, age: 0.05 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'covered-and-open-choir-stands-back',
    name: 'Choir stands back',
    category: 'voice',
    description:
      'A tape choir on chords whose inner pair steps up and returns, across the room from you and wandering nearer and farther.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.5, release: 1.5, players: 1, tone: -0.2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Restless' }],
  },
  {
    id: 'covered-and-open-strings-lean-along',
    name: 'Strings lean along',
    category: 'string',
    description:
      'Slow tape strings on the tune of two sighs, their tones alone kept and their starts thrown away, in a muffled rising choir.',
    preview: SIGHS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { volume: -2, attack: 0.15, release: 0.8, age: 0.6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'shimmer', preset: 'Muffled choir', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'covered-and-open-last-of-the-tape-strip',
    name: 'Last of the tape strip',
    category: 'texture',
    description:
      'Worn horns on a strip that runs out after two seconds, so long fifths are cut short and their cut is thrown backwards.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { volume: -3.5, tape: 3, speed: 0, length: 2, age: 0.8, hiss: 0.5, attack: 0.1 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Ghost' }],
  },
  // A guitar with the horn fifths.
  {
    id: 'covered-and-open-horn-fifths-on-nylon',
    name: 'Horn fifths on nylon',
    category: 'plucked',
    description:
      'A nylon guitar: the thumb has C and G, the fingers the sixth, fifth and third of two horns. Warm, in a small plate.',
    preview: THUMB_AND_FIFTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: -1, nail: 0.1, strum: 8, sustain: 4, release: 0.8 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'covered-and-open-post-road-at-noon',
    name: 'Post road at noon',
    category: 'plucked',
    description:
      'A bright twelve string with a hard nail, played near the bridge, its horn fifths crossing left to right on a dotted tape.',
    preview: THUMB_AND_FIFTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { volume: -3, strum: 30, release: 3, tone: 0.8 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.25 } }],
  },
  {
    id: 'covered-and-open-palm-where-a-hand-was',
    name: 'Palm where a hand was',
    category: 'plucked',
    description:
      'A steel guitar under the palm, each note stopped once let go, in the body of a thimble and pinned under a ceiling.',
    preview: ANSWERED,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { volume: -8, sustain: 2, position: 0.3, body: 1, nail: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble', params: { mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned' },
    ],
  },
  {
    id: 'covered-and-open-plucks-that-swell',
    name: 'Plucks that swell',
    category: 'string',
    description:
      'A dark steel guitar whose pluck is taken away, so thirds fade in over a fifth of a second like two horns, in a morning mist.',
    preview: THIRDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: -2.5, strum: 0, tone: 0.35 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 220, depth: 1 } },
      { deviceId: 'fog', preset: 'Morning mist' },
    ],
  },
  {
    id: 'covered-and-open-wires-in-the-larch',
    name: 'Wires in the larch',
    category: 'plucked',
    description:
      'Glassy picked steel left to ring, with four sympathetic strings tuned to C major, its bands twinkling apart.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -5, tone: 0.75, strum: 60, shimmer: 1.2 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Open triad', params: { root: 0 } },
      { deviceId: 'glimmer', preset: 'Wide twinkle' },
    ],
  },
  {
    id: 'covered-and-open-one-slow-hand',
    name: 'One slow hand',
    category: 'plucked',
    description:
      'Wide slow strums of four part chords on a steel guitar, chorused, with a soft shadow at half speed an octave below.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { volume: 0.5, nail: 0, position: 0.35 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { lowCut: 120 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
    ],
  },
  // String machine: the bed the horns stand on.
  {
    id: 'covered-and-open-straw-under-the-horns',
    name: 'Straw under the horns',
    category: 'pad',
    description:
      'Plain cellos of a string ensemble under slow horn fifths, narrow and close, crumbling in a dark autumn.',
    preview: SLOW_FIFTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.35, release: 1.5, ensemble: 0.3, width: 0.3 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Leaf fall' }],
  },
  {
    id: 'covered-and-open-sky-over-the-call',
    name: 'Sky over the call',
    category: 'pad',
    description:
      'High glassy ensemble strings, two fifths held, their highs drifting side to side in a wide airy tail.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.8, release: 2.5, tone: 5000 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'covered-and-open-organ-without-shade',
    name: 'Organ without shade',
    category: 'organ',
    description:
      'The ensemble switched off and the saws as plain as an organ: a chorale with no covered note in it, from a stone stairwell.',
    preview: LIGHT_SHADE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -9, release: 0.3, low: 0.2, tone: 1500, high: 0.4 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'covered-and-open-violas-fold-in',
    name: 'Violas fold in',
    category: 'string',
    description:
      'Middle saws alone in thirds, with only what two moments share let through, so held notes hang and changes fade.',
    preview: THIRDS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.06, release: 0.4, tone: 2600 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Hanging notes' }],
  },
  {
    id: 'covered-and-open-low-fog-c-standing',
    name: 'Low fog, C standing',
    category: 'pad',
    description:
      'A very dark string ensemble under C held in two octaves, opened and shut very slowly by a low-pass and spread wide.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 0.9, release: 2, tone: 800, low: 0.7 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  // The tube itself: pedals.
  {
    id: 'covered-and-open-second-and-third-partial',
    name: 'Second and third partial',
    category: 'drone',
    description:
      'C2 and G2, partials two and three of the C crook, as still harmonic tones of sines, in an endless low cathedral.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: { attack: 1, release: 2, cutoff: 2500 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'covered-and-open-air-standing-in-brass',
    name: 'Air standing in brass',
    category: 'drone',
    description:
      'A tuned wind with no partials, only breath at the pedal and its fifth, blown through a metal pipe.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { attack: 1.2, release: 2, rate: 0.15 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Inside a pipe' }],
  },
  {
    id: 'covered-and-open-fifth-of-the-field',
    name: 'Fifth of the field',
    category: 'drone',
    description:
      'Just fifths in saw on the two swells, with what is quiet in them, the overtones, turned up and brought forward.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { attack: 0.8, release: 2, wave: 0.8, cutoff: 1800, sub: 0.1 },
    },
    effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
  },
  {
    id: 'covered-and-open-hounds-asleep',
    name: 'Hounds asleep',
    category: 'drone',
    description:
      'A low hum in octaves with its sub, hardly moving, whose level rises and falls at the pace of sleep.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { attack: 1, release: 2, cutoff: 400 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Asleep' },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'covered-and-open-whole-ladder-at-once',
    name: 'Whole ladder at once',
    category: 'drone',
    description:
      'Each key a whole harmonic series, all the open notes of a tube sounding together, stirred into slow water.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { attack: 1.2, release: 2.5, air: 0.2, wave: 0.2, cutoff: 4500 },
    },
    effects: [{ deviceId: 'currents', preset: 'Slow water' }],
  },
  // A voice that picks the partials a horn has.
  {
    id: 'covered-and-open-sung-up-the-ladder',
    name: 'Sung up the ladder',
    category: 'voice',
    description:
      'A throat that steps quickly from harmonic to harmonic, the ladder of a tube sung over a fifth, with a faint answer nearly a second late.',
    preview: TWO_SWELLS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: { attack: 0.2, release: 1, pace: 2 },
    },
    effects: [{ deviceId: 'canon', preset: 'Faint answer' }],
  },
  {
    id: 'covered-and-open-eleventh-held-still',
    name: 'Eleventh held still',
    category: 'drone',
    description:
      'A still whistle on the eleventh harmonic, the one the hand pulls down to F, over C and G and in long sines behind.',
    preview: PEDAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { overtone: 11, attack: 0.6, release: 1.5 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Long linger' }],
  },
  {
    id: 'covered-and-open-lips-against-a-pipe',
    name: 'Lips against a pipe',
    category: 'wind',
    description:
      'A buzzing pipe low in its harmonics, growled, on the low tune, played from a loudspeaker at the far end of a hall.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { growl: 0.5, focus: 0.45, release: 0.4 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Far end of the hall' }],
  },
  {
    id: 'covered-and-open-reed-that-shades-itself',
    name: 'Reed that shades itself',
    category: 'drone',
    description:
      'A reed drone whose vowels open and darken slowly while C stands and the inner pair moves, with an octave halo of pads.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { wander: 0.8, focus: 0.3, attack: 0.5, release: 1.5, breath: 0 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Octave halo', params: { mix: 0.3 } }],
  },
]
