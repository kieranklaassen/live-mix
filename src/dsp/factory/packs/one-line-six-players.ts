import { type FactoryPreset, type Phrase } from '../types'

// One melody handed from player to player with no seam, and the five voices a reflection about a
// centre note makes of it. Each instrument was laid out by how a note is taken over and let go,
// how bright its player is and how far off they sit; most previews carry one free voice.

// One line in three players: each takes it over on the note the last one is still holding.
const HANDED_ON: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 64, gain: 0.45 },
    { atSec: 0.7, durSec: 0.7, note: 67, gain: 0.45 },
    { atSec: 1.4, durSec: 1.1, note: 65, gain: 0.42 },
    { atSec: 2, durSec: 0.65, note: 65, gain: 0.3 },
    { atSec: 2.6, durSec: 0.9, note: 69, gain: 0.48 },
    { atSec: 3.5, durSec: 0.85, note: 67, gain: 0.42 },
    { atSec: 4, durSec: 0.45, note: 67, gain: 0.28 },
    { atSec: 4.4, durSec: 0.7, note: 64, gain: 0.42 },
    { atSec: 5.1, durSec: 1.3, note: 62, gain: 0.42 },
  ],
}

// The same for high winds: three players, two shared notes, and a close on the D they set out
// from.
const HANDED_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 74, gain: 0.4 },
    { atSec: 0.6, durSec: 0.6, note: 77, gain: 0.42 },
    { atSec: 1.2, durSec: 1, note: 76, gain: 0.4 },
    { atSec: 1.8, durSec: 0.65, note: 76, gain: 0.28 },
    { atSec: 2.4, durSec: 0.6, note: 79, gain: 0.44 },
    { atSec: 3, durSec: 1.1, note: 81, gain: 0.46 },
    { atSec: 3.7, durSec: 0.55, note: 81, gain: 0.3 },
    { atSec: 4.2, durSec: 0.6, note: 77, gain: 0.42 },
    { atSec: 4.8, durSec: 0.5, note: 76, gain: 0.4 },
    { atSec: 5.3, durSec: 1.1, note: 74, gain: 0.4 },
  ],
}

// Another line, C D B E D B A, over its mirror about A4, F E G D E G A; a free voice makes F, an
// open fourth chord, E minor and D minor of it, then G and the centre at rest on D.
const CONTRARY_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 65, gain: 0.34 },
    { atSec: 0, durSec: 0.9, note: 72, gain: 0.44 },
    { atSec: 0, durSec: 1.65, note: 69, gain: 0.32 },
    { atSec: 0.9, durSec: 0.75, note: 64, gain: 0.34 },
    { atSec: 0.9, durSec: 0.75, note: 74, gain: 0.44 },
    { atSec: 1.65, durSec: 0.75, note: 64, gain: 0.32 },
    { atSec: 1.65, durSec: 0.75, note: 67, gain: 0.34 },
    { atSec: 1.65, durSec: 0.75, note: 71, gain: 0.44 },
    { atSec: 2.4, durSec: 1.1, note: 62, gain: 0.34 },
    { atSec: 2.4, durSec: 1.1, note: 65, gain: 0.32 },
    { atSec: 2.4, durSec: 1.1, note: 76, gain: 0.44 },
    { atSec: 3.5, durSec: 0.75, note: 64, gain: 0.34 },
    { atSec: 3.5, durSec: 0.75, note: 67, gain: 0.32 },
    { atSec: 3.5, durSec: 0.75, note: 74, gain: 0.44 },
    { atSec: 4.25, durSec: 0.75, note: 67, gain: 0.34 },
    { atSec: 4.25, durSec: 0.75, note: 71, gain: 0.44 },
    { atSec: 4.25, durSec: 2.25, note: 62, gain: 0.32 },
    { atSec: 5, durSec: 1.5, note: 69, gain: 0.44 },
  ],
}

// The line and its mirror about D4 over a free third voice: F, D, E, F, A and home to D.
const CONTRARY_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 53, gain: 0.32 },
    { atSec: 0, durSec: 0.75, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 0.75, note: 64, gain: 0.44 },
    { atSec: 0.75, durSec: 0.75, note: 57, gain: 0.34 },
    { atSec: 0.75, durSec: 0.75, note: 67, gain: 0.44 },
    { atSec: 1.5, durSec: 0.75, note: 50, gain: 0.32 },
    { atSec: 1.5, durSec: 0.75, note: 59, gain: 0.34 },
    { atSec: 1.5, durSec: 0.75, note: 65, gain: 0.44 },
    { atSec: 2.25, durSec: 1.1, note: 52, gain: 0.32 },
    { atSec: 2.25, durSec: 1.1, note: 55, gain: 0.34 },
    { atSec: 2.25, durSec: 1.1, note: 69, gain: 0.44 },
    { atSec: 3.35, durSec: 0.75, note: 53, gain: 0.32 },
    { atSec: 3.35, durSec: 0.75, note: 57, gain: 0.34 },
    { atSec: 3.35, durSec: 0.75, note: 67, gain: 0.44 },
    { atSec: 4.1, durSec: 0.75, note: 57, gain: 0.32 },
    { atSec: 4.1, durSec: 0.75, note: 60, gain: 0.34 },
    { atSec: 4.1, durSec: 0.75, note: 64, gain: 0.44 },
    { atSec: 4.85, durSec: 1.4, note: 50, gain: 0.32 },
    { atSec: 4.85, durSec: 1.4, note: 62, gain: 0.44 },
  ],
}

// All six voices, E G A E D: line, mirror about D4, the two halfway voices, the flipped octave and
// D held, with a free A at the close.
const SIX_VOICES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 50, gain: 0.32 },
    { atSec: 0, durSec: 1.3, note: 60, gain: 0.29 },
    { atSec: 0, durSec: 1.3, note: 64, gain: 0.41 },
    { atSec: 0, durSec: 5, note: 62, gain: 0.24 },
    { atSec: 1.3, durSec: 1.2, note: 52, gain: 0.32 },
    { atSec: 1.3, durSec: 1.2, note: 57, gain: 0.29 },
    { atSec: 1.3, durSec: 1.2, note: 60, gain: 0.27 },
    { atSec: 1.3, durSec: 1.2, note: 64, gain: 0.27 },
    { atSec: 1.3, durSec: 1.2, note: 67, gain: 0.41 },
    { atSec: 2.5, durSec: 1.4, note: 53, gain: 0.32 },
    { atSec: 2.5, durSec: 1.4, note: 55, gain: 0.29 },
    { atSec: 2.5, durSec: 1.4, note: 59, gain: 0.27 },
    { atSec: 2.5, durSec: 1.4, note: 65, gain: 0.27 },
    { atSec: 2.5, durSec: 1.4, note: 69, gain: 0.41 },
    { atSec: 3.9, durSec: 1.1, note: 50, gain: 0.32 },
    { atSec: 3.9, durSec: 1.1, note: 60, gain: 0.29 },
    { atSec: 3.9, durSec: 1.1, note: 64, gain: 0.41 },
    { atSec: 5, durSec: 1.6, note: 50, gain: 0.32 },
    { atSec: 5, durSec: 1.6, note: 57, gain: 0.27 },
    { atSec: 5, durSec: 1.6, note: 62, gain: 0.41 },
  ],
}

// The five answering voices with the line left out, for someone to lay a tune over.
const ANSWERS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 52, gain: 0.3 },
    { atSec: 0, durSec: 1.3, note: 57, gain: 0.27 },
    { atSec: 0, durSec: 1.3, note: 60, gain: 0.26 },
    { atSec: 0, durSec: 5, note: 62, gain: 0.22 },
    { atSec: 0, durSec: 1.3, note: 64, gain: 0.26 },
    { atSec: 1.3, durSec: 1.2, note: 52, gain: 0.3 },
    { atSec: 1.3, durSec: 1.2, note: 59, gain: 0.27 },
    { atSec: 1.3, durSec: 1.2, note: 60, gain: 0.26 },
    { atSec: 1.3, durSec: 1.2, note: 64, gain: 0.26 },
    { atSec: 2.5, durSec: 1.5, note: 53, gain: 0.3 },
    { atSec: 2.5, durSec: 1.5, note: 55, gain: 0.27 },
    { atSec: 2.5, durSec: 1.5, note: 59, gain: 0.26 },
    { atSec: 2.5, durSec: 1.5, note: 65, gain: 0.26 },
    { atSec: 4, durSec: 1, note: 50, gain: 0.3 },
    { atSec: 4, durSec: 1, note: 60, gain: 0.27 },
    { atSec: 5, durSec: 1.3, note: 50, gain: 0.3 },
    { atSec: 5, durSec: 1.3, note: 57, gain: 0.26 },
    { atSec: 5, durSec: 1.3, note: 62, gain: 0.26 },
  ],
}

// A minor about B3: the line falls E D C B, the mirror climbs F G A B with the halfway voices inside;
// a free bass goes D C A E, to an open fifth.
const FALL_TO_B: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 50, gain: 0.34 },
    { atSec: 0, durSec: 1.5, note: 53, gain: 0.34 },
    { atSec: 0, durSec: 1.5, note: 57, gain: 0.28 },
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.28 },
    { atSec: 0, durSec: 1.5, note: 64, gain: 0.42 },
    { atSec: 1.5, durSec: 1.5, note: 48, gain: 0.34 },
    { atSec: 1.5, durSec: 1.5, note: 55, gain: 0.34 },
    { atSec: 1.5, durSec: 1.5, note: 57, gain: 0.28 },
    { atSec: 1.5, durSec: 1.5, note: 60, gain: 0.28 },
    { atSec: 1.5, durSec: 1.5, note: 62, gain: 0.42 },
    { atSec: 3, durSec: 1.5, note: 45, gain: 0.34 },
    { atSec: 3, durSec: 1.5, note: 57, gain: 0.34 },
    { atSec: 3, durSec: 1.5, note: 59, gain: 0.28 },
    { atSec: 3, durSec: 1.5, note: 60, gain: 0.42 },
    { atSec: 4.5, durSec: 1.7, note: 52, gain: 0.34 },
    { atSec: 4.5, durSec: 1.7, note: 59, gain: 0.42 },
  ],
}

// A line that comes down, A G E F G E D, its mirror coming up, G A C B A C D, and a free bass: C six,
// F nine, A minor, G seven, C six, F with its seventh, then D and A bare.
const FREE_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.05, note: 48, gain: 0.34 },
    { atSec: 0, durSec: 1.05, note: 55, gain: 0.32 },
    { atSec: 0, durSec: 1.05, note: 69, gain: 0.44 },
    { atSec: 1.05, durSec: 0.75, note: 41, gain: 0.34 },
    { atSec: 1.05, durSec: 0.75, note: 57, gain: 0.32 },
    { atSec: 1.05, durSec: 0.75, note: 67, gain: 0.44 },
    { atSec: 1.8, durSec: 0.75, note: 45, gain: 0.34 },
    { atSec: 1.8, durSec: 0.75, note: 60, gain: 0.32 },
    { atSec: 1.8, durSec: 0.75, note: 64, gain: 0.44 },
    { atSec: 2.55, durSec: 1.1, note: 43, gain: 0.34 },
    { atSec: 2.55, durSec: 1.1, note: 59, gain: 0.32 },
    { atSec: 2.55, durSec: 1.1, note: 65, gain: 0.44 },
    { atSec: 3.65, durSec: 0.75, note: 48, gain: 0.34 },
    { atSec: 3.65, durSec: 0.75, note: 57, gain: 0.32 },
    { atSec: 3.65, durSec: 0.75, note: 67, gain: 0.44 },
    { atSec: 4.4, durSec: 0.75, note: 41, gain: 0.34 },
    { atSec: 4.4, durSec: 0.75, note: 60, gain: 0.32 },
    { atSec: 4.4, durSec: 0.75, note: 64, gain: 0.44 },
    { atSec: 5.15, durSec: 1.4, note: 38, gain: 0.34 },
    { atSec: 5.15, durSec: 1.4, note: 57, gain: 0.32 },
    { atSec: 5.15, durSec: 1.4, note: 62, gain: 0.44 },
  ],
}

// The line handed up an octave, back and down, each time on one note that both registers sound
// together.
const OCTAVE_HANDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.55, note: 64, gain: 0.5 },
    { atSec: 0.55, durSec: 0.55, note: 57, gain: 0.28 },
    { atSec: 0.55, durSec: 0.55, note: 67, gain: 0.48 },
    { atSec: 1.1, durSec: 1.1, note: 59, gain: 0.28 },
    { atSec: 1.1, durSec: 0.6, note: 65, gain: 0.46 },
    { atSec: 1.1, durSec: 0.6, note: 77, gain: 0.3 },
    { atSec: 1.65, durSec: 0.55, note: 67, gain: 0.26 },
    { atSec: 1.65, durSec: 0.55, note: 81, gain: 0.5 },
    { atSec: 2.2, durSec: 0.55, note: 69, gain: 0.26 },
    { atSec: 2.2, durSec: 0.55, note: 79, gain: 0.48 },
    { atSec: 2.75, durSec: 0.8, note: 65, gain: 0.3 },
    { atSec: 2.75, durSec: 0.8, note: 71, gain: 0.26 },
    { atSec: 2.75, durSec: 0.8, note: 77, gain: 0.44 },
    { atSec: 3.3, durSec: 0.55, note: 69, gain: 0.48 },
    { atSec: 3.85, durSec: 0.6, note: 55, gain: 0.34 },
    { atSec: 3.85, durSec: 0.55, note: 67, gain: 0.46 },
    { atSec: 4.4, durSec: 0.55, note: 52, gain: 0.46 },
    { atSec: 4.95, durSec: 0.6, note: 53, gain: 0.42 },
    { atSec: 4.95, durSec: 0.6, note: 57, gain: 0.26 },
    { atSec: 5.5, durSec: 0.8, note: 50, gain: 0.5 },
    { atSec: 5.5, durSec: 0.8, note: 57, gain: 0.3 },
    { atSec: 5.5, durSec: 0.8, note: 62, gain: 0.36 },
  ],
}

// Chords of the six voices broken so that each note is another player, the line first: G F A E D.
const ONE_NOTE_EACH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 67, gain: 0.46 },
    { atSec: 0.34, durSec: 0.8, note: 57, gain: 0.34 },
    { atSec: 0.68, durSec: 0.8, note: 64, gain: 0.34 },
    { atSec: 1.02, durSec: 0.8, note: 60, gain: 0.34 },
    { atSec: 1.36, durSec: 0.8, note: 65, gain: 0.46 },
    { atSec: 1.7, durSec: 0.8, note: 59, gain: 0.34 },
    { atSec: 2.04, durSec: 0.8, note: 64, gain: 0.34 },
    { atSec: 2.38, durSec: 0.8, note: 60, gain: 0.34 },
    { atSec: 2.72, durSec: 0.8, note: 69, gain: 0.46 },
    { atSec: 3.06, durSec: 0.8, note: 55, gain: 0.34 },
    { atSec: 3.4, durSec: 0.8, note: 65, gain: 0.34 },
    { atSec: 3.74, durSec: 0.8, note: 59, gain: 0.34 },
    { atSec: 4.08, durSec: 0.8, note: 64, gain: 0.46 },
    { atSec: 4.42, durSec: 0.8, note: 60, gain: 0.34 },
    { atSec: 4.76, durSec: 0.8, note: 62, gain: 0.34 },
    { atSec: 5.1, durSec: 1.2, note: 62, gain: 0.46 },
    { atSec: 5.44, durSec: 1.2, note: 50, gain: 0.34 },
    { atSec: 5.78, durSec: 1.2, note: 57, gain: 0.34 },
    { atSec: 6.12, durSec: 1.2, note: 74, gain: 0.34 },
  ],
}

// The falling line by itself: E D C B, each note handed over while the last still sounds, and the
// E below to close.
const LONE_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 1.4, durSec: 1.6, note: 62, gain: 0.46 },
    { atSec: 2.8, durSec: 1.6, note: 60, gain: 0.46 },
    { atSec: 4.2, durSec: 2.1, note: 59, gain: 0.48 },
    { atSec: 4.4, durSec: 1.9, note: 52, gain: 0.36 },
  ],
}

// The centre D and its fifth held from end to end while a line, F A E D, goes round them and comes
// home.
const HELD_CENTRE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 50, gain: 0.34 },
    { atSec: 0, durSec: 6.3, note: 57, gain: 0.28 },
    { atSec: 0.4, durSec: 1.5, note: 65, gain: 0.44 },
    { atSec: 1.8, durSec: 1.5, note: 69, gain: 0.44 },
    { atSec: 3.2, durSec: 1.4, note: 64, gain: 0.42 },
    { atSec: 4.5, durSec: 1.8, note: 62, gain: 0.42 },
  ],
}

// Four long pairs about G4, for a sound that takes its time: B over E, D over C, C over D, and the
// centre, with a free C under it.
const LONG_PAIRS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 1.5, note: 71, gain: 0.46 },
    { atSec: 1.4, durSec: 1.5, note: 60, gain: 0.36 },
    { atSec: 1.4, durSec: 1.5, note: 74, gain: 0.46 },
    { atSec: 2.8, durSec: 1.5, note: 62, gain: 0.36 },
    { atSec: 2.8, durSec: 1.5, note: 72, gain: 0.46 },
    { atSec: 4.2, durSec: 1.9, note: 60, gain: 0.36 },
    { atSec: 4.2, durSec: 1.9, note: 67, gain: 0.46 },
  ],
}

// The free bass by itself: C F A G C F and D, under nothing.
const BASS_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.05, note: 48, gain: 0.6 },
    { atSec: 1.05, durSec: 0.75, note: 41, gain: 0.6 },
    { atSec: 1.8, durSec: 0.75, note: 45, gain: 0.6 },
    { atSec: 2.55, durSec: 1.1, note: 43, gain: 0.6 },
    { atSec: 3.65, durSec: 0.75, note: 48, gain: 0.6 },
    { atSec: 4.4, durSec: 0.75, note: 41, gain: 0.6 },
    { atSec: 5.15, durSec: 1.4, note: 38, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Flute: how a breath is taken over, from a tongued start to one with none, and how far off the chair is.
  {
    id: 'one-line-six-players-same-breath-new-lips',
    name: 'Same breath, new lips',
    category: 'wind',
    description:
      'A concert flute eased on and off, its joins blurred by a short cloud, with an airy hall that keeps the highs longest.',
    preview: HANDED_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { attack: 0.14, release: 1.1, chiff: 0.1, vibrato: 0.15, volume: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { size: 140 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'one-line-six-players-the-reflected-flute',
    name: 'The reflected flute',
    category: 'wind',
    description:
      'A straight flute with its mirror about D above middle C sounding on the left and its halfway voice on the right, in a small plate.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.06, release: 0.6, breath: 0.2, volume: -3 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: {
          center: 62,
          v1Role: 2,
          v1Level: -2,
          v1Pan: -60,
          v2Role: 3,
          v2Degrees: 0,
          v2Level: -5,
          v2Pan: 60,
          v3Role: 0,
          mix: 60,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'one-line-six-players-low-chair-takes-it',
    name: 'Low chair takes it',
    category: 'wind',
    description:
      'An alto flute tongued hard into a large stopped pipe that rings with it, with a quiet sub-octave and fifteenth of drawbars.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { breath: 0.2, vibrato: 0.1, chiff: 1, attack: 0.02, release: 0.3, volume: -10 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Cistern',
        params: { size: 2, material: 0.6, air: 0.1, mix: 0.6 },
      },
      {
        deviceId: 'stops',
        preset: 'Flute stops',
        params: { sub: 0.5, octave: 0, fifteenth: 0.35, mix: 0.6 },
      },
    ],
  },
  {
    id: 'one-line-six-players-bamboo-over-the-wall',
    name: 'Bamboo over the wall',
    category: 'wind',
    description:
      'A bent bamboo flute answered once, an octave down, by a follower on one side, all of it on narrow worn tape.',
    preview: HANDED_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.08, scoop: 80, vibrato: 0.6, release: 0.9, volume: -9 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: { gap: 1.2, mix: 0.45, tone: 3500, spread: 1 },
      },
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.15, wow: 0.4 } },
    ],
  },
  {
    id: 'one-line-six-players-one-pipe-makes-five',
    name: 'One pipe makes five',
    category: 'wind',
    description:
      'Pan pipes with their full chiff and four players made of them, mirror, halfway, its mirror and its octave, entering in turn.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.35, blow: 0.6, release: 0.25, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: {
          center: 62,
          v1Role: 2,
          v1Degrees: 0,
          v1Level: -3,
          v1Pan: -80,
          v1Delay: 70,
          v2Role: 3,
          v2Degrees: 0,
          v2Level: -6,
          v2Pan: 80,
          v2Delay: 140,
          v3Role: 4,
          v3Degrees: 0,
          v3Level: -6,
          v3Pan: -35,
          v3Delay: 210,
          v4Role: 5,
          v4Degrees: 0,
          v4Level: -7,
          v4Pan: 35,
          v4Delay: 280,
          mix: 58,
        },
      },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-six-players-lesson-recorder',
    name: 'Lesson recorder',
    category: 'wind',
    description:
      'A soft wood flute with almost no breath, played through a plain loudspeaker and recorded from across a room.',
    preview: CONTRARY_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.05, blow: 0.2, chiff: 0.5, release: 0.12, volume: -9 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { room: 0.8, distance: 0.6 } },
    ],
  },
  {
    id: 'one-line-six-players-last-air-of-the-line',
    name: 'Last air of the line',
    category: 'wind',
    description:
      'Pipes that are nearly all breath, with the lows cut away, their quiet air lifted and a faint bright plate behind.',
    preview: CONTRARY_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.2, release: 1.2, blow: 0.2, volume: -6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 260, air: 5, presence: 2 } },
      { deviceId: 'reveal', preset: 'Air' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'one-line-six-players-swell-through-the-join',
    name: 'Swell through the join',
    category: 'wind',
    description:
      'A wood flute that swells for most of a second, with a soft string pad an octave up following it.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 0.8, release: 2.5, breath: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { mix: 0.4, fall: 3 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'one-line-six-players-centre-kept-by-breath',
    name: 'Centre kept by breath',
    category: 'pad',
    description:
      'A low flute that is mostly air, circling slowly round the head and rising and falling with a calm breath.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { blow: 0.3, attack: 0.7, release: 2, volume: -10 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 1.6, out: 2.2, depth: 0.5 } },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'one-line-six-players-bent-in-from-the-side',
    name: 'Bent in from the side',
    category: 'wind',
    description:
      'A bamboo flute scooping up two semitones into each note, with a reversed space that rises into the next.',
    preview: HANDED_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { breath: 0.6, blow: 0.55, chiff: 0.5, release: 0.6, volume: -11 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 0.7, mix: 0.5 } }],
  },
  {
    id: 'one-line-six-players-hard-tongue-soft-reply',
    name: 'Hard tongue, soft reply',
    category: 'wind',
    description:
      'A flute tongued hard and bright whose echoes land closer and closer together, each one duller.',
    preview: HANDED_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { vibrato: 0.3, release: 0.15, volume: -11 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Sinking away',
        params: { first: 420, drop: 0, mix: 0.42 },
      },
      { deviceId: 'saturator', preset: 'Warm glue' },
    ],
  },
  {
    id: 'one-line-six-players-twelve-second-flutes',
    name: 'Twelve second flutes',
    category: 'wind',
    description:
      'A soft flute lead turned into twelve that wheel about it at some distance, with a dark hall behind them.',
    preview: CONTRARY_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { attack: 0.2, vibrato: 0.2, volume: -9 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Wheeling', params: { range: 20, turns: 0.5, mix: 0.65 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-six-players-third-hand-backwards',
    name: 'Third hand, backwards',
    category: 'wind',
    description:
      'A wood flute under a low-pass filter, with what it has just played coming back reversed an octave lower.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { release: 0.5, scoop: 20, volume: -9 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 850, resonance: 0.8 } },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 1100, mix: 0.45 } },
    ],
  },
  // Clarinet: the bore from narrow to wide, the start from a tongue to nothing, and who sits beside it.
  {
    id: 'one-line-six-players-seam-under-the-reed',
    name: 'Seam under the reed',
    category: 'wind',
    description:
      'A clarinet that begins each note straight and sways the longer it is held, with a faint fifth and a lower octave on drawbars.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { attack: 0.07, blow: 0.7, release: 0.5, volume: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 250, grow: 600 } },
      { deviceId: 'stops', preset: 'Open fifths', params: { fifth: 0.3, sub: 0.5, mix: 0.45 } },
    ],
  },
  {
    id: 'one-line-six-players-bass-reed-hands-it-up',
    name: 'Bass reed hands it up',
    category: 'wind',
    description:
      'A bass clarinet with a drawbar an octave above and one a twelfth above speaking a little after it.',
    preview: CONTRARY_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.3, release: 0.6, volume: -2 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Octave above',
        params: { twelfth: 0.45, speak: 220, mix: 0.65 },
      },
    ],
  },
  {
    id: 'one-line-six-players-subtone-second-desk',
    name: 'Subtone, second desk',
    category: 'wind',
    description:
      'A breathy low-blown tenor on cassette, its highs gone and its pitch a little loose.',
    preview: CONTRARY_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { attack: 0.1, vibrato: 0.1, breath: 0.7, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.2, tone: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-six-players-out-of-the-held-note',
    name: 'Out of the held note',
    category: 'wind',
    description:
      'A clarinet rising out of silence, its strongest partials redrawn an octave up as pure sines that linger.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1, release: 1.6, volume: -5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.55, attack: 300 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'one-line-six-players-six-hollow-reeds',
    name: 'Six hollow reeds',
    category: 'wind',
    description:
      'A hollow clarinet section made thicker by a deep slow ensemble, with a long plate over it.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.3, release: 0.9, volume: 1.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5, feedback: 10 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-six-players-reed-at-the-well',
    name: 'Reed at the well',
    category: 'wind',
    description: 'A double-reed tone with a wide sway, ringing a bank of strings tuned to D minor.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { blow: 0.5, vibrato: 0.4, release: 0.3, volume: -1 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 2, decay: 5, mix: 0.6 } },
    ],
  },
  {
    id: 'one-line-six-players-crossing-the-platform',
    name: 'Crossing the platform',
    category: 'wind',
    description:
      'A bright wide-bored reed swinging from one ear to the other, with one short slap behind it.',
    preview: HANDED_HIGH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 0.85, breath: 0.1, volume: 4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.35 } },
    ],
  },
  {
    id: 'one-line-six-players-growl-in-the-sleeve',
    name: 'Growl in the sleeve',
    category: 'wind',
    description: 'A growling tenor held under a low-pass filter, with dark bucket-brigade repeats.',
    preview: CONTRARY_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.4, release: 0.5, volume: 1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 700, slope: 1, resonance: 0.8 },
      },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 560, feedback: 0.4, mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-six-players-hum-that-goes-round',
    name: 'Hum that goes round',
    category: 'wind',
    description:
      'A reed blown so softly it hums, with its octave below, panned at random from side to side under a slow compressor.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.2, release: 0.8, volume: -4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
    ],
  },
  {
    id: 'one-line-six-players-whispered-along-a-row',
    name: 'Whispered along a row',
    category: 'wind',
    description:
      'A reed that is nearly all breath, smeared across the spectrum until its notes hang in a thin mist.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.35, release: 1.4, blow: 0.15, volume: -2 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { blur: 0.65, mix: 0.6 } },
    ],
  },
  {
    id: 'one-line-six-players-tenor-lets-go-slowly',
    name: 'Tenor lets go slowly',
    category: 'wind',
    description:
      'A wide-bored reed that swells for a second and leaves over five, in a huge dark space that swells in too.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 1.1, vibrato: 0.2, volume: 2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Bloom', params: { highCut: 2600, mix: 0.4, decay: 9 } },
    ],
  },
  {
    id: 'one-line-six-players-ballad-for-three-chairs',
    name: 'Ballad for three chairs',
    category: 'wind',
    description:
      'An alto with a full vibrato, its mirror about D to the left, its halfway voice flipped an octave to the right, in a hot valve.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { vibrato: 0.6, release: 0.5, volume: -2 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: {
          center: 62,
          v1Role: 2,
          v1Degrees: 0,
          v1Level: -3,
          v1Pan: -70,
          v1Delay: 60,
          v2Role: 5,
          v2Degrees: 0,
          v2Level: -6,
          v2Pan: 70,
          v2Delay: 120,
          v3Role: 0,
          v4Role: 0,
          mix: 55,
        },
      },
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.05 } },
    ],
  },
  {
    id: 'one-line-six-players-flutter-into-the-next',
    name: 'Flutter into the next',
    category: 'wind',
    description:
      'A flutter-tongued clarinet through a slow twelve-stage phaser, let into its reverb in waves.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { growl: 0.8, blow: 0.6, breath: 0.4, volume: 5.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 5, mix: 0.35 } },
    ],
  },
  // Choir: who sings, from basses to trebles, on which vowel, and what carries it to the next row.
  {
    id: 'one-line-six-players-ahs-along-the-bench',
    name: 'Ahs along the bench',
    category: 'voice',
    description:
      'A section on Ah with a quick start, its lows centred and its top opened wide, in a warm hall with a long low end.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.25, release: 1.2, motion: 0.1, volume: -5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-line-six-players-passed-down-to-monks',
    name: 'Passed down to monks',
    category: 'voice',
    description: 'Low voices on Oh with two octaves added beneath them, filtered dark.',
    preview: LONE_LINE,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.5, release: 1.8, vowel: 0.75, volume: -6 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub1: 0.6, sub2: 0.35, filter: 600 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'one-line-six-players-boys-catch-the-tail',
    name: 'Boys catch the tail',
    category: 'voice',
    description:
      'Small voices on Oo whose last moment is replayed in small loops stacked at octaves and fifths.',
    preview: HANDED_HIGH,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.12, release: 0.8, ensemble: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { interval: 1, mix: 0.4, time: 350 } },
    ],
  },
  {
    id: 'one-line-six-players-breath-before-the-entry',
    name: 'Breath before the entry',
    category: 'voice',
    description:
      'Voices that are mostly breath, sifted so the air is loudest and its attacks are left out, scattered wide.',
    preview: ANSWERS,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.5, release: 1.6, vowel: 0.45, volume: -6 },
    },
    effects: [
      {
        deviceId: 'sift',
        preset: 'Soft hammers',
        params: { tones: -8, attacks: -30, air: 6, scatter: 1 },
      },
    ],
  },
  {
    id: 'one-line-six-players-vowel-changes-hands',
    name: 'Vowel changes hands',
    category: 'voice',
    description:
      'Voices sliding through every vowel, split into bands that each swell and drift sideways on their own.',
    preview: FALL_TO_B,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 0.9, release: 2.4, vowel: 0.5, volume: -10 },
    },
    effects: [{ deviceId: 'currents', preset: 'Breaking waves', params: { rate: 0.4, sway: 0.7 } }],
  },
  {
    id: 'one-line-six-players-glass-row-replies',
    name: 'Glass row replies',
    category: 'voice',
    description:
      'Still voices on Ee, every band of them flickering on its own, with a faint climbing tail.',
    preview: ANSWERS,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.5, release: 2, volume: -10 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints', params: { depth: 0.8 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'one-line-six-players-one-singer-round-three',
    name: 'One singer, round three',
    category: 'voice',
    description:
      'A single singer with vibrato, followed nearly three seconds apart by two more at pitch, one from either side.',
    preview: LONE_LINE,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 20, release: 0.4, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 2.8, fade: 0.3, spread: 1, mix: 0.45 },
      },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'one-line-six-players-hummed-through-wood',
    name: 'Hummed through wood',
    category: 'voice',
    description:
      'A hummed section opened a little toward Oh, played inside a small wooden soundboard with two springs behind.',
    preview: FALL_TO_B,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.35, release: 1, voice: 1.2, tone: 1600, vowel: 0.7, volume: -8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.5, mix: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'one-line-six-players-altos-take-the-answer',
    name: 'Altos take the answer',
    category: 'voice',
    description:
      'Altos on Eh with a steady vibrato through a slow rotating cabinet set across the room, with a small room added.',
    preview: ANSWERS,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { attack: 0.35, release: 1, volume: -4.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'one-line-six-players-short-ah-long-neighbour',
    name: 'Short ah, long neighbour',
    category: 'voice',
    description:
      'Clipped voices on Ah that a sustainer catches and holds on as an even, gliding pad.',
    preview: ONE_NOTE_EACH,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { release: 0.3, breath: 0.2, volume: -3 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 0.5, decay: 4, glide: 0.5, mix: 0.55 },
      },
    ],
  },
  {
    id: 'one-line-six-players-tenors-on-the-tie',
    name: 'Tenors on the tie',
    category: 'voice',
    description: 'Tenors on Oh driven into a soft fuzz between a short reverb and a long one.',
    preview: CONTRARY_LOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.2, release: 0.8, vibrato: 10, volume: -5.5 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 4, mix: 0.4 } }],
  },
  {
    id: 'one-line-six-players-trebles-leave-the-line',
    name: 'Trebles leave the line',
    category: 'voice',
    description:
      'High voices with a wandering vowel whose tail rises in pitch, thins and blurs as it ages.',
    preview: CONTRARY_HIGH,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.3, release: 1.5, breath: 0.15, volume: -5 },
    },
    effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { sag: 25, hold: 3, mix: 0.42 } }],
  },
  // Harp: where the string is plucked and what it is made of, how long it rings, and who answers it.
  {
    id: 'one-line-six-players-harps-an-octave-apart',
    name: 'Harps an octave apart',
    category: 'plucked',
    description:
      'A concert harp with the octave above it, a little out of tune and to the side, in a medium hall.',
    preview: OCTAVE_HANDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { decay: 1.4, halo: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.8, detune: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-six-players-low-hand-to-high-hand',
    name: 'Low hand to high hand',
    category: 'plucked',
    description:
      'A soft long-ringing harp split into colours that arrive one after another, lowest first.',
    preview: ONE_NOTE_EACH,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { sweep: 0.2, pluck: 0.3, volume: -2 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 450, mix: 0.5, feedback: 0.2 } },
    ],
  },
  {
    id: 'one-line-six-players-table-edge-reply',
    name: 'Table edge reply',
    category: 'plucked',
    description:
      'A harp plucked hard by the soundboard, its dotted tape repeats answering on the other side.',
    preview: OCTAVE_HANDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { decay: 0.35, touch: 0.8, halo: 0.1, volume: 6 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { heads: 3, time: 330, spread: 1, mix: 0.4 },
      },
    ],
  },
  {
    id: 'one-line-six-players-ring-left-to-the-bowls',
    name: 'Ring left to the bowls',
    category: 'plucked',
    description:
      'A glassy harp whose strings ring for a long time over low bowls tuned to D and its fifth, with the top shaded.',
    preview: ONE_NOTE_EACH,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { decay: 2.2, halo: 0.7, volume: 2 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 2, mix: 0.45, ring: 12 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-line-six-players-hand-flat-on-strings',
    name: 'Hand flat on strings',
    category: 'plucked',
    description: 'A damped harp played into a dry drum head, squeezed so each thud is even.',
    preview: FREE_BASS,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.95, decay: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 1.4, mix: 0.55 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 8, outputGain: -4 } },
    ],
  },
  {
    id: 'one-line-six-players-koto-heard-in-reverse',
    name: 'Koto heard in reverse',
    category: 'plucked',
    description:
      'Zither strings plucked softly near the bridge and evened out, over a bed of what was just played looping backwards.',
    preview: OCTAVE_HANDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { decay: 1.2, touch: 0.45, halo: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 1.4, mix: 0.42 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 26, outputGain: -8.5 } },
    ],
  },
  {
    id: 'one-line-six-players-silk-to-be-pressed',
    name: 'Silk to be pressed',
    category: 'plucked',
    description:
      'Dull silk strings pressed a little sharp as they sound, in a slow smear of their own grains.',
    preview: LONE_LINE,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 35, decay: 2.2, volume: 6 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.45, feedback: 0.2 } },
    ],
  },
  {
    id: 'one-line-six-players-steel-strung-relay',
    name: 'Steel-strung relay',
    category: 'plucked',
    description:
      'Bright steel strings whose two followers play what they heard backwards, pressed level by a limiter.',
    preview: ONE_NOTE_EACH,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { touch: 0.5, decay: 0.8, volume: 6 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Crab canon', params: { gap: 0.8, mix: 0.45, fade: 0.2 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 12, outputGain: -7.5 } },
    ],
  },
  {
    id: 'one-line-six-players-hollow-harp-downstairs',
    name: 'Hollow harp downstairs',
    category: 'plucked',
    description:
      'A harp plucked at its middle and kept dark, with a half-speed copy an octave below it.',
    preview: LONE_LINE,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 1, touch: 0.15, volume: 0 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 700, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  // Aurora: one desk of brass or strings, from a stabbed start to a long swell, and open to closed.
  {
    id: 'one-line-six-players-brass-desk-inherits',
    name: 'Brass desk inherits',
    category: 'pad',
    description:
      'A slow brass layer made quick and bright, pushed into a hot valve, with one long tape slap behind it.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        attack: 0.06,
        release: 0.8,
        contour: 0.9,
        brilliance: 1800,
        lowCut: 160,
        swell: 0.3,
        volume: -16,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 240, mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-six-players-horns-behind-the-door',
    name: 'Horns behind the door',
    category: 'pad',
    description:
      'Soft horns swelling over most of a second, heard next door with the air taken out of them.',
    preview: FALL_TO_B,
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.6, release: 1.6, volume: -8 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { level: 0.9 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-six-players-desk-shares-a-stand',
    name: 'Desk shares a stand',
    category: 'pad',
    description:
      'Bright strings with no low end and a fast spinning speaker blended in, with no reverb at all.',
    preview: CONTRARY_HIGH,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.2, release: 0.6, detune: 4, lowCut: 500, resonance: 0.45, volume: -0.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend', params: { speed: 1, mix: 0.7 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'one-line-six-players-night-desk-sings-back',
    name: 'Night desk sings back',
    category: 'pad',
    description: 'A resonant choir-like layer into a hall whose tail is shaped as a sung Oo.',
    preview: ANSWERS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { attack: 0.6, release: 1.8, volume: -8 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } }],
  },
  {
    id: 'one-line-six-players-metal-desk-at-dawn',
    name: 'Metal desk at dawn',
    category: 'bell',
    description:
      'A ring-modulated pad with a fast start, with sparks thrown up to two octaves above it.',
    preview: ONE_NOTE_EACH,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.02, swell: 0, release: 2, volume: -6 },
    },
    effects: [{ deviceId: 'glints', preset: 'First light', params: { density: 9, mix: 0.35 } }],
  },
  {
    id: 'one-line-six-players-stab-and-long-answer',
    name: 'Stab and long answer',
    category: 'pad',
    description:
      'Short synthetic brass whose chord swells in again behind it as a low section of strings.',
    preview: FREE_BASS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { brilliance: 1400, release: 0.35, volume: -5 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Low section', params: { rise: 0.5, mix: 0.6 } }],
  },
  {
    id: 'one-line-six-players-pipes-share-one-wind',
    name: 'Pipes share one wind',
    category: 'organ',
    description:
      'A plain pipe-like layer with a fifth drawn over it, an octave under it and a soft tremor.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { release: 0.5, brilliance: 2000, volume: -9.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { fifth: 0.4, speak: 100 } },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.25, rate: 5 } },
    ],
  },
  {
    id: 'one-line-six-players-loose-reeds-agree-late',
    name: 'Loose reeds agree late',
    category: 'pad',
    description: 'A widely detuned reed layer passed through a moving notch and dark repeats.',
    preview: CONTRARY_LOW,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { attack: 0.1, release: 0.8, volume: -4.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-line-six-players-silver-thread-continues',
    name: 'Silver thread continues',
    category: 'pad',
    description:
      'A silver string layer with a quick start and a resonant edge over cut lows, its tail climbing by fifths in a narrow reverb.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: {
        attack: 0.25,
        release: 1.2,
        brilliance: 5000,
        lowCut: 500,
        resonance: 0.55,
        detune: 4,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Narrow fifth', params: { mix: 0.32, decay: 5 } }],
  },
  // Chamber strings: players on the note, where the bow is, the mute, and the desk that takes over.
  {
    id: 'one-line-six-players-bow-change-unheard',
    name: 'Bow change unheard',
    category: 'string',
    description:
      'Three bright string players whose changes of note are blurred by a thick fog, in a long bright plate.',
    preview: FREE_BASS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 3,
        attack: 0.15,
        release: 1.2,
        mute: 0,
        bow: 0.8,
        air: 0,
        vibrato: 10,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog', params: { size: 320, damp: 0, mix: 0.85 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.4, decay: 0.8 } },
    ],
  },
  {
    id: 'one-line-six-players-mutes-at-half-level',
    name: 'Mutes at half level',
    category: 'string',
    description:
      'Five muted players with no vibrato, drawbars an octave and a twelfth above speaking after them, for the answers alone.',
    preview: ANSWERS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.5, release: 1.4, volume: -5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Hollow fifths',
        params: { octave: 0.9, fifth: 0, twelfth: 0.5, speak: 350, mix: 0.75 },
      },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'one-line-six-players-whispered-page-turn',
    name: 'Whispered page turn',
    category: 'string',
    description:
      'Bows that barely touch, mostly air, filtered toward whatever each moment shares with the one just before it.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.4, release: 1.5, air: 1, volume: -6 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.7 } }],
  },
  {
    id: 'one-line-six-players-bow-meets-its-mirror',
    name: 'Bow meets its mirror',
    category: 'string',
    description:
      'A close solo string with a late vibrato, its mirror about the B below middle C climbing on one side as it falls.',
    preview: LONE_LINE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { vibrato: 0, attack: 0.1, volume: 2 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 400 } },
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: {
          center: 59,
          v1Role: 2,
          v1Degrees: 0,
          v1Level: -2,
          v1Pan: -75,
          v1Delay: 0,
          v2Role: 0,
          v3Role: 0,
          v4Role: 0,
          mix: 55,
        },
      },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25, time: 620 } },
    ],
  },
  {
    id: 'one-line-six-players-bridge-bows-in-a-ring',
    name: 'Bridge bows in a ring',
    category: 'string',
    description:
      'Glassy bowing at the bridge combed by a deep eight-stage phaser, in a small bright chamber.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.5, release: 1.6, volume: 2 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-line-six-players-ragged-but-together',
    name: 'Ragged but together',
    category: 'string',
    description:
      'Six bright bows scattered far from unison and then scattered again as ten dull copies far off, with octaves above and below swelling in.',
    preview: CONTRARY_HIGH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.15, release: 0.6, bow: 0.85, mute: 0.1, volume: -3.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Wide and dull', params: { mix: 0.75 } },
      {
        deviceId: 'octaves',
        preset: 'Cathedral',
        params: { sub2: 0, sub1: 0.6, up1: 0.6, up2: 0.2 },
      },
    ],
  },
  {
    id: 'one-line-six-players-short-bows-long-hall',
    name: 'Short bows, long hall',
    category: 'string',
    description:
      'Short bows that stop at once, carried on by tight clusters of echoes and a bright hall.',
    preview: FREE_BASS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { bow: 1, release: 0.1, attack: 0.07, air: 0, volume: -4 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Tight clusters',
        params: { span: 900, mix: 0.45, again: 0.5, tone: 4000 },
      },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-line-six-players-consort-in-one-chest',
    name: 'Consort in one chest',
    category: 'string',
    description:
      'Viols dead in tune, two to a part and muted, heard down a narrow clay pot of a body with a short room.',
    preview: CONTRARY_LOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { players: 2, attack: 0.12, release: 0.4, bow: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.4 } },
    ],
  },
  // Droplets: the line given away a drop at a time, by what the drops land on and how they are timed.
  {
    id: 'one-line-six-players-drops-take-turns',
    name: 'Drops take turns',
    category: 'bell',
    description:
      'Glass drops in an even pulse at the pitch that is held, crossing between sides in scattered echoes.',
    preview: ANSWERS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass pulse',
      params: { rain: 5, spread: 0, soft: 0.4, volume: 1 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 1200, mix: 0.4 } },
    ],
  },
  {
    id: 'one-line-six-players-slow-tap-on-the-sill',
    name: 'Slow tap on the sill',
    category: 'bell',
    description: 'Large slow drops on glass, darkened and sent into two springs.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Slow drip',
      params: { rain: 1.6, soft: 0.6, volume: -8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 1400 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'one-line-six-players-wooden-bucket-chain',
    name: 'Wooden bucket chain',
    category: 'plucked',
    description: 'A steady pulse of drops on wood, six to the second, doubled an octave down.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { size: 0.7, ring: 1.8, volume: -1.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.7 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'one-line-six-players-six-hands-in-the-basin',
    name: 'Six hands in the basin',
    category: 'texture',
    description: 'Drops on water, a little under its surface, with bubbles rising off each one.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { rain: 6, ring: 2, spread: 1, volume: -8 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { depth: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'one-line-six-players-felt-feet-in-file',
    name: 'Felt feet in file',
    category: 'plucked',
    description:
      'Soft felt drops in no strict time, each caught and replayed as a loop an octave down backwards.',
    preview: ANSWERS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { rain: 6, size: 0.6, ring: 1.6, volume: 1.5 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Undertow', params: { mix: 0.45 } }],
  },
  {
    id: 'one-line-six-players-drizzle-held-in-metal',
    name: 'Drizzle held in metal',
    category: 'bell',
    description:
      'Metal drops spread over two octaves, their pitches sagging slowly as the tail melts.',
    preview: LONG_PAIRS,
    instrument: { deviceId: 'droplets', preset: 'Bell drizzle', params: { rain: 3.5, volume: -3 } },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.42 } }],
  },
  {
    id: 'one-line-six-players-chimes-after-the-line',
    name: 'Chimes after the line',
    category: 'bell',
    description:
      'Large long metal chimes falling slowly, their strikes softened and their tones held on.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: { rain: 2.2, size: 0.7, volume: -3 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Long wash', params: { hold: 0.7 } },
      { deviceId: 'glimmer', preset: 'Light on water' },
    ],
  },
  {
    id: 'one-line-six-players-gusts-down-the-line',
    name: 'Gusts down the line',
    category: 'texture',
    description:
      'Bursts of small high drops on glass, pitched up again by grains that climb a fifth each time.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: { rain: 9, size: 0.25, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { time: 420, feedback: 0.4, mix: 0.35 },
      },
    ],
  },
  // Felt piano: two hands of one player, from bare to buried, and what carries a note to the other hand.
  {
    id: 'one-line-six-players-left-hand-finishes-it',
    name: 'Left hand finishes it',
    category: 'keys',
    description:
      'A muffled piano with no room and all its action noise, doubled wide either side and pressed into tape.',
    preview: FREE_BASS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { felt: 0.8, hardness: 0.35, thump: 0.7, width: 0.3, outputDb: -18 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'one-line-six-players-bare-keys-in-contrary',
    name: 'Bare keys in contrary',
    category: 'keys',
    description:
      'A bare piano with its mirror about D harmonised live on one side and the centre D sounding on the other.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.5, reverbMix: 0.1, outputDb: -6 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: {
          v1Role: 2,
          v1Level: -3,
          v1Pan: -70,
          v2Role: 6,
          v2Degrees: 0,
          v2Level: -6,
          v2Pan: 70,
          v3Role: 0,
          mix: 55,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'one-line-six-players-glass-upright-relay',
    name: 'Glass upright relay',
    category: 'keys',
    description:
      'A bright stiff-strung upright whose notes are restruck in small loops, many an octave up, the lows cut away and the level held.',
    preview: OCTAVE_HANDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0, hardness: 0.65, stiffness: 1.6, outputDb: -7 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 300, mix: 0.6, high: 0.8 } },
      { deviceId: 'auto-filter', preset: 'Init', params: { type: 1, cutoffHz: 240 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 16, outputGain: -10 } },
    ],
  },
  {
    id: 'one-line-six-players-driven-grand-sits-out',
    name: 'Driven grand sits out',
    category: 'keys',
    description:
      'An overdriven piano through a warm loudspeaker stack, its highs turned away from the microphone.',
    preview: FREE_BASS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { reverbMix: 0.1, outputDb: -13 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { noise: 0 } }],
  },
  {
    id: 'one-line-six-players-piano-without-entries',
    name: 'Piano without entries',
    category: 'pad',
    description:
      'A pedalled piano with the attack of every note removed, so each comes out of the one before, then levelled.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { felt: 0.4, hardness: 0.5, outputDb: -2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 500 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 8 } },
    ],
  },
  {
    id: 'one-line-six-players-next-room-has-the-tune',
    name: 'Next room has the tune',
    category: 'keys',
    description:
      'A piano heard from the next room, with moments of what it played drifting back under plain echoes.',
    preview: LONE_LINE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { reverbSize: 0.4, outputDb: -10 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.45 } }],
  },
  // West coast: the same struck tone folded a little or a lot, let go at once or held.
  {
    id: 'one-line-six-players-mallet-to-mallet',
    name: 'Mallet to mallet',
    category: 'plucked',
    description: 'A soft round mallet tone bouncing between the sides in echoes that slow down.',
    preview: ONE_NOTE_EACH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.4, throw: 1 } },
    ],
  },
  {
    id: 'one-line-six-players-folded-second-reed',
    name: 'Folded second reed',
    category: 'wind',
    description:
      'A folded reed tone split into bands that swell and drift from side to side, with a long plate over it.',
    preview: CONTRARY_LOW,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { attack: 0.12, fold: 0.45, volume: -5.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-six-players-thumbs-in-sixes',
    name: 'Thumbs in sixes',
    category: 'plucked',
    description: 'A short thumb-plucked tone with loops of unequal length turning round it.',
    preview: OCTAVE_HANDS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 0.45, volume: 0.5 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Short canon', params: { mix: 0.45 } }],
  },
  {
    id: 'one-line-six-players-slow-fold-between-us',
    name: 'Slow fold between us',
    category: 'pad',
    description:
      'A tone that swells and folds as it opens, blurred by a soft shaped bloom of reverb.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 0.8, decay: 2, volume: -4 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 1.6, mix: 0.45 } }],
  },
  {
    id: 'one-line-six-players-floor-of-the-line',
    name: 'Floor of the line',
    category: 'bass',
    description:
      'A round folded bass tone with its gate nearly closed, pushed into thumping tape and thickened a little.',
    preview: BASS_ALONE,
    instrument: { deviceId: 'west-coast', preset: 'Round bass', params: { volume: 0.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0 } },
      { deviceId: 'chorus', preset: 'Vocal thickener' },
    ],
  },
  // Afterglow: the strike belongs to one player and the glow it leaves to the next.
  {
    id: 'one-line-six-players-felt-strikes-glow-stays',
    name: 'Felt strikes, glow stays',
    category: 'keys',
    description:
      'A dark felt strike with a glow that opens quickly behind it, through a slow rotating cabinet with an octave added below.',
    preview: FREE_BASS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { bloom: 0.5, fade: 2, tone: 0.3, strike: 0.6, volume: -11 },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { drive: 0.1, distance: 0.1, hornDepth: 0.9 },
      },
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
    ],
  },
  {
    id: 'one-line-six-players-bell-lends-its-ring',
    name: 'Bell lends its ring',
    category: 'bell',
    description:
      'A bell whose halo is held and raised, rung into a tuned bank of strings that learns the chord.',
    preview: ONE_NOTE_EACH,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { bloom: 1.2, fade: 4, volume: -10 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.4 } }],
  },
  {
    id: 'one-line-six-players-pluck-owes-the-haze',
    name: 'Pluck owes the haze',
    category: 'plucked',
    description: 'A bright pluck with a faint glow and steady echoes rebuilt from backward grains.',
    preview: OCTAVE_HANDS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { glow: 0.25, decay: 1.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Backwards shards', params: { time: 330, mix: 0.4 } },
    ],
  },
  {
    id: 'one-line-six-players-only-what-was-lent',
    name: 'Only what was lent',
    category: 'pad',
    description: 'The glow with no strike before it, smeared across the spectrum and kept dark.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.6, fade: 3, tone: 0.3, volume: -19.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } }],
  },
  {
    id: 'one-line-six-players-still-glass-desk',
    name: 'Still glass desk',
    category: 'bell',
    description:
      'Struck glass with a glow that never moves, widened at the top and set in a short bright ambience.',
    preview: FALL_TO_B,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { bloom: 1, fade: 2.5, volume: -10 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Tight shimmer' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 1.8, mix: 0.3 } },
    ],
  },
  // Rewind: an entry heard backwards, so one player is already leaving when the next arrives.
  {
    id: 'one-line-six-players-enters-as-it-leaves',
    name: 'Enters as it leaves',
    category: 'keys',
    description:
      'A piano played backwards that swells for a second, lands softly and rings on, in a cathedral tail.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Mirror note',
      params: { swell: 0.9, snap: 0.2, volume: 4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'one-line-six-players-bell-comes-to-meet-it',
    name: 'Bell comes to meet it',
    category: 'bell',
    description:
      'A bell gathering backwards to its strike, with pieces of it falling a fifth as they fade.',
    preview: LONG_PAIRS,
    instrument: { deviceId: 'rewind', preset: 'Bell arrival', params: { swell: 1.1, volume: 5 } },
    effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.4 } }],
  },
  {
    id: 'one-line-six-players-pluck-handed-back',
    name: 'Pluck handed back',
    category: 'plucked',
    description:
      'A short backward pluck that stops almost dead, thrown into chorused bucket-brigade repeats.',
    preview: HANDED_ON,
    instrument: { deviceId: 'rewind', preset: 'Pluck back', params: { swell: 0.4, volume: 4 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Chorused', params: { time: 480, mix: 0.4 } }],
  },
  {
    id: 'one-line-six-players-worn-reel-between-us',
    name: 'Worn reel between us',
    category: 'pad',
    description: 'A wavering backward piano on a worn cassette, a slow swell for each long note.',
    preview: FALL_TO_B,
    instrument: {
      deviceId: 'rewind',
      preset: 'Worn reel',
      params: { swell: 1.2, wobble: 0.5, volume: 3.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  // Feedback: two held strings that take the amplifier from each other.
  {
    id: 'one-line-six-players-string-takes-the-amp',
    name: 'String takes the amp',
    category: 'string',
    description:
      'A plucked string caught by its amplifier on the note itself, with the centre D an octave down held beside it, in a medium plate.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { bloom: 0.3, release: 1.2, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: {
          center: 62,
          v1Role: 6,
          v1Degrees: -7,
          v1Level: -4,
          v1Pan: 0,
          v1Delay: 0,
          v2Role: 0,
          v3Role: 0,
          v4Role: 0,
          mix: 50,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-line-six-players-twelfth-hands-over',
    name: 'Twelfth hands over',
    category: 'string',
    description:
      'A string with no pick that sings on its twelfth with no grit, its changes fogged and a pulsing space after it.',
    preview: LONE_LINE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 0.2, pick: 0, release: 2.5, volume: -3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise', params: { size: 300, mix: 0.8 } },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-line-six-players-mirror-wants-the-amp',
    name: 'Mirror wants the amp',
    category: 'texture',
    description:
      'Notes plucked hard that fight for one gritty amplifier and turn slowly to their double octave, with murky repeats.',
    preview: LONG_PAIRS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Fighting chord',
      params: { grit: 0.45, distance: 4, bloom: 1.2, pick: 0.8, crowd: 1, volume: -6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 700, feedback: 0.35, mix: 0.25 },
      },
    ],
  },
  {
    id: 'one-line-six-players-bowed-out-of-the-hum',
    name: 'Bowed out of the hum',
    category: 'drone',
    description:
      'A string with no pick that rises glassy on its octave out of its own feedback, with six slow copies drifting round it.',
    preview: HELD_CENTRE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Glass bow',
      params: { bloom: 0.8, release: 2, distance: 2, volume: -6 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Slow drift', params: { mix: 0.5 } }],
  },
  // Flock: every note a small flock, so a line is passed by birds that leave late.
  {
    id: 'one-line-six-players-six-birds-one-tune',
    name: 'Six birds, one tune',
    category: 'pad',
    description:
      'Six gliding voices in a close unison that gather quickly and leave late, with worn tape repeats after them.',
    preview: HANDED_ON,
    instrument: {
      deviceId: 'flock',
      preset: 'Clean unison',
      params: { birds: 6, gather: 0.15, leave: 0.9, volume: -9 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { mix: 0.3, time: 500, feedback: 0.35 },
      },
    ],
  },
  {
    id: 'one-line-six-players-reed-birds-in-a-hedge',
    name: 'Reed birds in a hedge',
    category: 'pad',
    description:
      'A reedy flock flying in from both sides through a moving resonance, with a small dark space after it.',
    preview: FALL_TO_B,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { gather: 0.25, stray: 0.1, volume: -12 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'one-line-six-players-whistler-and-answer',
    name: 'Whistler and answer',
    category: 'wind',
    description:
      'A single pure whistle with one follower a little later, a fourth below to one side.',
    preview: HANDED_HIGH,
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { gather: 0.09, leave: 0.5, volume: -2 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { interval1: -5, gap: 0.6, mix: 0.4, spread: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'one-line-six-players-scatter-at-the-cadence',
    name: 'Scatter at the cadence',
    category: 'texture',
    description:
      'A flock that comes quickly, beats its wings and flies off slowly, the chord left in a soft fuzz with its octave above.',
    preview: SIX_VOICES,
    instrument: {
      deviceId: 'flock',
      preset: 'Scattering',
      params: { leave: 3, stray: 0.25, flutter: 1.5, volume: -11 },
    },
    effects: [{ deviceId: 'haze', preset: 'Octave glow', params: { mix: 0.35, decay: 4 } }],
  },
]
