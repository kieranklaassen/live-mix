import { type FactoryPreset, type Phrase } from '../types'

// One high note is held and never moves, and the root under it changes, so that the same note is
// in turn the third harmonic of what is below, the fourth, the fifth and so on up to the twelfth.
// Every root is tuned down from the held note by a whole-number ratio: 12 log2 n semitones.
// Two of the instruments sing a chosen harmonic of the key themselves (the whistle, the magnets),
// so there the number on the knob is a name, and one of the roots sings the held note itself.

// The pack's own melodies and chords (what its previews play).

// G5 as the 12th of C2, the 7th of A2 and 31 cents, the 9th of F2, the 10th of E flat 2; each root with its 3rd and 5th.
const FOUR_NAMES_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 79, gain: 0.3 },
    { atSec: 0, durSec: 1.8, note: 35.98, gain: 0.5 },
    { atSec: 0.1, durSec: 1.7, note: 55, gain: 0.3 },
    { atSec: 0.2, durSec: 1.6, note: 63.84, gain: 0.25 },
    { atSec: 1.8, durSec: 1.8, note: 45.31, gain: 0.5 },
    { atSec: 1.9, durSec: 1.7, note: 64.33, gain: 0.3 },
    { atSec: 2, durSec: 1.6, note: 73.17, gain: 0.25 },
    { atSec: 3.6, durSec: 1.8, note: 40.96, gain: 0.5 },
    { atSec: 3.7, durSec: 1.7, note: 59.98, gain: 0.3 },
    { atSec: 3.8, durSec: 1.6, note: 68.82, gain: 0.25 },
    { atSec: 5.4, durSec: 1.9, note: 39.14, gain: 0.5 },
    { atSec: 5.5, durSec: 1.8, note: 58.16, gain: 0.3 },
    { atSec: 5.6, durSec: 1.7, note: 67, gain: 0.25 },
  ],
}
// A4 as the 3rd of D3, then as the 5th of F2; the voice between steps from D4 to C4.
const SLOW_PAIR_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 69, gain: 0.4 },
    { atSec: 0, durSec: 3.6, note: 49.98, gain: 0.5 },
    { atSec: 0.2, durSec: 3.4, note: 61.98, gain: 0.3 },
    { atSec: 3.6, durSec: 3.6, note: 41.14, gain: 0.55 },
    { atSec: 3.7, durSec: 3.5, note: 60.16, gain: 0.3 },
  ],
}
// D6 as the 8th, 9th, 10th, 11th and 12th of roots that sink by 204, 182, 165 and 151 cents.
const SINKING_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 86, gain: 0.28 },
    { atSec: 0, durSec: 1.45, note: 50, gain: 0.55 },
    { atSec: 1.45, durSec: 1.45, note: 47.96, gain: 0.55 },
    { atSec: 2.9, durSec: 1.45, note: 46.14, gain: 0.55 },
    { atSec: 4.35, durSec: 1.45, note: 44.49, gain: 0.55 },
    { atSec: 5.8, durSec: 1.5, note: 42.98, gain: 0.6 },
  ],
}
// A4 as the 3rd of D3, the 4th of A2, the 5th of F2 and the 6th of D2.
const THREE_TO_SIX_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 69, gain: 0.3 },
    { atSec: 0, durSec: 1.8, note: 49.98, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 45, gain: 0.55 },
    { atSec: 3.6, durSec: 1.8, note: 41.14, gain: 0.55 },
    { atSec: 5.4, durSec: 1.8, note: 37.98, gain: 0.6 },
  ],
}
// A5 as the 8th of A2, the 9th of G2, the 10th of F2 and the 12th of D2.
const EIGHT_TO_TWELVE_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 81, gain: 0.25 },
    { atSec: 0, durSec: 1.8, note: 45, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 42.96, gain: 0.55 },
    { atSec: 3.6, durSec: 1.8, note: 41.14, gain: 0.55 },
    { atSec: 5.4, durSec: 1.8, note: 37.98, gain: 0.6 },
  ],
}
// G4 as the 3rd of C3, the 4th of G2, the 5th of E flat 2 and the 6th of C2.
const THREE_TO_SIX_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 67, gain: 0.3 },
    { atSec: 0, durSec: 1.8, note: 47.98, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 43, gain: 0.55 },
    { atSec: 3.6, durSec: 1.8, note: 39.14, gain: 0.55 },
    { atSec: 5.4, durSec: 1.9, note: 35.98, gain: 0.6 },
  ],
}
// E5 as the 5th of C3, the 6th of A2, the 7th of F sharp 2 and 31 cents, the 8th of E2.
const FIVE_TO_EIGHT_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 76, gain: 0.3 },
    { atSec: 0, durSec: 1.8, note: 48.14, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 44.98, gain: 0.55 },
    { atSec: 3.6, durSec: 1.8, note: 42.31, gain: 0.55 },
    { atSec: 5.4, durSec: 1.8, note: 40, gain: 0.6 },
  ],
}
// A5 with four of its roots together: it is the 12th of D2, the 8th of A2, the 5th of F3, the 3rd of D4.
const ALL_AT_ONCE_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 81, gain: 0.4 },
    { atSec: 0.8, durSec: 5.8, note: 61.98, gain: 0.4 },
    { atSec: 1.7, durSec: 4.9, note: 53.14, gain: 0.45 },
    { atSec: 2.7, durSec: 3.9, note: 45, gain: 0.45 },
    { atSec: 3.8, durSec: 2.8, note: 37.98, gain: 0.5 },
  ],
}
// E5 as the 5th of C3, the 3rd of A3, the 4th of E3 and the 9th of D2; the inner voices are harmonics of each root.
const FOUR_CHORDS_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 76, gain: 0.35 },
    { atSec: 0, durSec: 1.8, note: 48.14, gain: 0.45 },
    { atSec: 0, durSec: 1.8, note: 67.16, gain: 0.3 },
    { atSec: 1.8, durSec: 1.8, note: 56.98, gain: 0.45 },
    { atSec: 1.8, durSec: 1.8, note: 68.98, gain: 0.3 },
    { atSec: 3.6, durSec: 1.8, note: 52, gain: 0.45 },
    { atSec: 3.6, durSec: 1.8, note: 71.02, gain: 0.3 },
    { atSec: 5.4, durSec: 1.9, note: 37.96, gain: 0.5 },
    { atSec: 5.4, durSec: 1.9, note: 56.98, gain: 0.3 },
    { atSec: 5.4, durSec: 1.9, note: 65.82, gain: 0.3 },
  ],
}
// E5 as the 11th of a root 51 cents under B1 (with its 3rd, 5th and 7th), then as the 10th of C2 (with its 3rd, 5th and 8th).
const ELEVEN_THEN_TEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 76, gain: 0.35 },
    { atSec: 0, durSec: 3.55, note: 34.49, gain: 0.5 },
    { atSec: 0.15, durSec: 3.4, note: 53.51, gain: 0.35 },
    { atSec: 0.3, durSec: 3.25, note: 62.35, gain: 0.25 },
    { atSec: 0.45, durSec: 3.1, note: 68.18, gain: 0.25 },
    { atSec: 3.6, durSec: 3.6, note: 36.14, gain: 0.5 },
    { atSec: 3.75, durSec: 3.45, note: 55.16, gain: 0.35 },
    { atSec: 3.9, durSec: 3.3, note: 64, gain: 0.25 },
    { atSec: 4.05, durSec: 3.15, note: 72.14, gain: 0.25 },
  ],
}
// B4 as the 3rd of E3, the 5th of G2, the 6th of E2, the 7th of C sharp 2 and 31 cents.
const FOUR_ROOTS_B: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 71, gain: 0.35 },
    { atSec: 0, durSec: 1.8, note: 51.98, gain: 0.5 },
    { atSec: 1.8, durSec: 1.8, note: 43.14, gain: 0.55 },
    { atSec: 3.6, durSec: 1.8, note: 39.98, gain: 0.55 },
    { atSec: 5.4, durSec: 1.8, note: 37.31, gain: 0.6 },
  ],
}
// E6 alone, then as the 3rd of A4, the 4th of E4 and the 5th of C4.
const THREE_NAMES_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 88, gain: 0.3 },
    { atSec: 0.9, durSec: 2, note: 68.98, gain: 0.45 },
    { atSec: 3, durSec: 2, note: 64, gain: 0.45 },
    { atSec: 5.1, durSec: 2.1, note: 60.14, gain: 0.5 },
  ],
}
// E5 alone, then as the 3rd of A3, the 4th of E3 and the 5th of C3: for brass and low flutes.
const ONE_E_LOWER_ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 76, gain: 0.35 },
    { atSec: 0.7, durSec: 2.1, note: 56.98, gain: 0.45 },
    { atSec: 2.8, durSec: 2.1, note: 52, gain: 0.45 },
    { atSec: 4.9, durSec: 2.3, note: 48.14, gain: 0.5 },
  ],
}
// A4 sounded again over each root, for what cannot hold a note: the 3rd of D3, the 4th of A2, the 5th of F2, the 6th of D2.
const SAME_A_AGAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.75, note: 69, gain: 0.4 },
    { atSec: 0, durSec: 1.75, note: 49.98, gain: 0.5 },
    { atSec: 1.8, durSec: 1.75, note: 69, gain: 0.4 },
    { atSec: 1.8, durSec: 1.75, note: 45, gain: 0.5 },
    { atSec: 3.6, durSec: 1.75, note: 69, gain: 0.4 },
    { atSec: 3.6, durSec: 1.75, note: 41.14, gain: 0.5 },
    { atSec: 5.4, durSec: 1.8, note: 69, gain: 0.4 },
    { atSec: 5.4, durSec: 1.8, note: 37.98, gain: 0.55 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Overtone: the number on the knob is the name, and one root of each phrase whistles the held note itself.
  {
    id: 'one-note-many-names-twelfth-of-a-low-d',
    name: 'Twelfth of a low D',
    category: 'voice',
    description:
      'A throat voice that whistles its twelfth harmonic and stays on it, slow to open, in a dark hall of six seconds.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { voice: 0, overtone: 12, attack: 0.8, release: 3, breath: 0.05 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 5, midDecay: 6, damping: 3200, mix: 0.45 },
      },
    ],
  },
  {
    id: 'one-note-many-names-third-in-the-pipe',
    name: 'Third in the pipe',
    category: 'drone',
    description:
      'A lip pipe resting on its third harmonic, dark and narrow, sounded again inside a longer wooden pipe.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: {
        voice: 1,
        overtone: 3,
        focus: 0.6,
        wander: 0,
        growl: 0.1,
        attack: 0.3,
        release: 0.8,
        width: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { body: 1, size: 2, material: 0.3, air: 0.1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'one-note-many-names-fifth-in-the-reed',
    name: 'Fifth in the reed',
    category: 'drone',
    description:
      'A bright reed on its fifth harmonic, quick on and off and nearly mono, through the small speaker of a bedside set.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: {
        voice: 2,
        overtone: 5,
        focus: 0.8,
        wander: 0,
        growl: 0,
        attack: 0.04,
        release: 0.4,
        width: 0.1,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { drive: 0.2, room: 0.3, noise: 0, output: -2 },
      },
    ],
  },
  {
    id: 'one-note-many-names-sixth-under-the-floor',
    name: 'Sixth under the floor',
    category: 'voice',
    description:
      'A growling chest chant on its sixth harmonic, its lows lifted and its top taken off, in a dark cave of nine seconds.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: { overtone: 6, focus: 0.4, wander: 0, growl: 0.75, attack: 0.7, release: 4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 4200 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Dark cave',
        params: { decay: 9, mix: 0.4, breathDepth: 0 },
      },
    ],
  },
  {
    id: 'one-note-many-names-seventh-of-f-sharp',
    name: 'Seventh of F sharp',
    category: 'voice',
    description:
      'A throat voice fixed on its seventh harmonic with a late vibrato, thickened by a slow chorus, in a room of nine seconds.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: {
        overtone: 7,
        focus: 0.9,
        wander: 0,
        vibrato: 0.6,
        attack: 0.9,
        release: 1.8,
        width: 0.9,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 9, mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-many-names-twelfth-and-rising',
    name: 'Twelfth and rising',
    category: 'wind',
    description:
      'A pipe narrowed to its twelfth harmonic, a thin whistle over three octaves up, with a tail that climbs slowly as it fades.',
    preview: SINKING_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: { overtone: 12, focus: 1, wander: 0, breath: 0.15, attack: 0.15, release: 1.2 },
    },
    effects: [
      { deviceId: 'spiral', preset: 'Slow ascent', params: { climb: 2, decay: 9, mix: 0.4 } },
    ],
  },
  {
    id: 'one-note-many-names-tenth-made-of-air',
    name: 'Tenth made of air',
    category: 'wind',
    description:
      'Breath whistled through the tenth harmonic, its onset blurred to a mist and an undamped plate laid behind it.',
    preview: EIGHT_TO_TWELVE_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Air whistle',
      params: {
        volume: -5.5,
        overtone: 10,
        focus: 0.9,
        wander: 0,
        breath: 1,
        attack: 0.9,
        release: 1.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-many-names-jaw-on-the-eighth',
    name: 'Jaw on the eighth',
    category: 'plucked',
    description:
      'A jaw twang held on the eighth harmonic with no air in it, stopped with the key and answered by a few dark tape repeats.',
    preview: EIGHT_TO_TWELVE_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { overtone: 8, focus: 0.95, wander: 0, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 450, feedback: 0.5, mix: 0.35 },
      },
    ],
  },
  {
    id: 'one-note-many-names-every-name-in-turn',
    name: 'Every name in turn',
    category: 'voice',
    description:
      'A whistle that steps from harmonic to harmonic of the held key, scattered afterwards over eleven uneven echoes.',
    preview: EIGHT_TO_TWELVE_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: { overtone: 9, pace: 2.2, focus: 0.85, attack: 0.02, release: 0.5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Full sky',
        params: { span: 2600, stars: 11, mix: 0.45 },
      },
    ],
  },
  {
    id: 'one-note-many-names-mouth-finding-its-word',
    name: 'Mouth finding its word',
    category: 'voice',
    description:
      'A wide mouth that drifts slowly over the low harmonics as vowels do, with a singing oh of a hall after it.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: {
        overtone: 5,
        focus: 0.1,
        wander: 1,
        pace: 0.3,
        breath: 0.45,
        attack: 0.5,
        release: 1.6,
      },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { vowel: 3, decay: 5, mix: 0.4 } },
    ],
  },
  {
    id: 'one-note-many-names-eleventh-between-keys',
    name: 'Eleventh between keys',
    category: 'drone',
    description:
      'A glassy reed on its eleventh harmonic, a half sharp eleventh of the key, its reverb rising an octave at a time.',
    preview: ELEVEN_THEN_TEN,
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { overtone: 11, breath: 0, vibrato: 0.15, attack: 1.5, release: 2 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { decay: 10, mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-ninth-turned-about',
    name: 'Ninth turned about',
    category: 'voice',
    description:
      'A broad throat chord on its ninth harmonic, sent round the slow horn and drum of a turning speaker, its rumble cut.',
    preview: EIGHT_TO_TWELVE_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Wide chord',
      params: { overtone: 9, focus: 0.45, wander: 0, vibrato: 0.2, attack: 0.25, release: 1.2 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.35, distance: 0.4, mix: 1 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: {} },
    ],
  },
  {
    id: 'one-note-many-names-fourth-across-a-yard',
    name: 'Fourth across a yard',
    category: 'drone',
    description:
      'Buzzing lips on the fourth harmonic, rough and steady, set far off across a wide space with the air taking the top.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { overtone: 4, growl: 1, focus: 0.5, attack: 0.08, release: 1.8, volume: -11.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { distance: 0.6, wander: 0.1 } },
    ],
  },

  // Magnet piano: the magnets are set to one harmonic of the string, so a low key sings a high note.
  {
    id: 'one-note-many-names-first-name-of-all',
    name: 'First name of all',
    category: 'keys',
    description:
      'A magnet piano fed on its own first harmonic, a plain glass swell with a hall of two and a half seconds.',
    preview: THREE_TO_SIX_G,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: { bloom: 0.6, harmonic: 1, bright: 0.1, sympathy: 0.5, damper: 1.2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'one-note-many-names-second-name-of-all',
    name: 'Second name of all',
    category: 'pad',
    description:
      'Strings sung on their second harmonic over a slow bloom, all ringing in sympathy, with an octave of sines behind.',
    preview: SLOW_PAIR_A,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: {
        volume: -10.5,
        bloom: 1.4,
        harmonic: 2,
        bright: 0.05,
        shimmer: 0.5,
        damper: 5,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { attack: 900, mix: 0.35 } },
    ],
  },
  {
    id: 'one-note-many-names-c-says-twelfth',
    name: 'C says twelfth',
    category: 'organ',
    description:
      'The third harmonic of each string, quick to speak and quick to damp like a small pipe, in a two spring tank.',
    preview: THREE_TO_SIX_G,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { volume: -14.5, bloom: 0.1, harmonic: 3, damper: 0.3, width: 0.2 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } }],
  },
  {
    id: 'one-note-many-names-same-g-from-below',
    name: 'Same G from below',
    category: 'pad',
    description:
      'Magnets on the fourth harmonic, so a low G sings two octaves up, spread fourteen cents each way in a dark plate.',
    preview: THREE_TO_SIX_G,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { bloom: 1.1, harmonic: 4, bright: 0.1, sweep: 0, shimmer: 0.6, damper: 3.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-note-many-names-c-says-third',
    name: 'C says third',
    category: 'bell',
    description:
      'Bowed glass on the fifth harmonic with no board under it, each band of it twinkling on its own.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { bloom: 0.3, harmonic: 5, bright: 0.25, shimmer: 0.9, damper: 1.6 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.9, rate: 2 } }],
  },
  {
    id: 'one-note-many-names-felt-under-the-sixth',
    name: 'Felt under the sixth',
    category: 'keys',
    description:
      'A felt hammer first and the sixth harmonic swelling in behind it, on worn cassette tape with a hall at the end.',
    preview: THREE_TO_SIX_G,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { bloom: 1.2, harmonic: 6, bright: 0.1, hammer: 0.9, damper: 1.6, body: 0.8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-many-names-seventh-in-plain-sine',
    name: 'Seventh in plain sine',
    category: 'keys',
    description:
      'A still, narrow tone on the natural seventh, no beating and no board, its one strongest partial redrawn behind it.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { bloom: 0.35, harmonic: 7, damper: 0.6 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'One sine', params: { mix: 0.5 } }],
  },
  {
    id: 'one-note-many-names-whistle-three-octaves',
    name: 'Whistle three octaves',
    category: 'bell',
    description:
      'The eighth harmonic of the string as a thin whistle three octaves up, repeated softly by a dark bucket delay.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { bloom: 0.15, harmonic: 8, damper: 0.8, hammer: 0.15 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 520, feedback: 0.45, mix: 0.35 },
      },
    ],
  },
  {
    id: 'one-note-many-names-tide-takes-the-names',
    name: 'Tide takes the names',
    category: 'pad',
    description:
      'A slow bloom whose magnets travel up and down the harmonics, with each band drifting side to side.',
    preview: SLOW_PAIR_A,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: {
        volume: -9,
        bloom: 1.8,
        bright: 0.2,
        sweep: 1,
        sweepRate: 0.3,
        damper: 4,
        shimmer: 0.3,
      },
    },
    effects: [{ deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.15 } }],
  },
  {
    id: 'one-note-many-names-root-in-soft-felt',
    name: 'Root in soft felt',
    category: 'keys',
    description:
      'Soft hammers alone on a woody board, damped soon after the key, and a table of still bowls in fifths on A that answers.',
    preview: SAME_A_AGAIN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { bloom: 9, hammer: 1, damper: 0.4, body: 0.9, width: 0.3, volume: -3 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Still bowls', params: { root: 9, scale: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-many-names-reed-with-no-reed',
    name: 'Reed with no reed',
    category: 'organ',
    description:
      'Strings fed on many harmonics at once, immediate and dry as a reed, with a slow low-pass opening and closing.',
    preview: SINKING_D,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { bright: 0.9, body: 0.2, damper: 0.15, width: 0.8 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass', params: {} }],
  },
  {
    id: 'one-note-many-names-four-roots-in-a-cave',
    name: 'Four roots in a cave',
    category: 'keys',
    description:
      'A dark wooden piano, half struck and half sung, close to the middle of a cavern made of small echoes.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { volume: -12.5, bloom: 1.2, hammer: 0.6, bright: 0.45, width: 0.2, damper: 2.5 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-ripple-of-titles',
    name: 'Ripple of titles',
    category: 'texture',
    description:
      'Magnets sweeping fast between the low harmonics, and every colour of it delayed by a different time.',
    preview: FOUR_NAMES_G,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: { harmonic: 4.5, sweepRate: 1.7, bloom: 0.15, damper: 2 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 900, mix: 0.45 } }],
  },

  // Wind harp: one wind over several strings; which harmonic of each it lights is the name.
  {
    id: 'one-note-many-names-single-wire-for-an-a',
    name: 'Single wire for an A',
    category: 'string',
    description:
      'One bare string to a key, steady and in the middle, and a bank of ten D minor strings that rings along with it.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { volume: -15.5, wind: 0.2, ring: 2.5, touch: 0.3, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor wash',
        params: { strings: 6, decay: 6, mix: 0.45, width: 0.3 },
      },
    ],
  },
  {
    id: 'one-note-many-names-gale-through-four-roots',
    name: 'Gale through four roots',
    category: 'string',
    description:
      'A high gale over four strings to a key, lighting the upper harmonics in hard gusts, in a bright hall.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'High gale',
      params: { volume: -1.5, wind: 0.95, strings: 4, ring: 1.5, air: 0.15, release: 1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } }],
  },
  {
    id: 'one-note-many-names-held-through-the-lull',
    name: 'Held through the lull',
    category: 'string',
    description:
      'Wind that keeps dropping to nothing and coming back over two strings a key, pulsed once a second in the middle band.',
    preview: SLOW_PAIR_A,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Long lulls',
      params: { volume: -1.5, gust: 0.6, ring: 1.5, release: 6, width: 1 },
    },
    effects: [{ deviceId: 'band-pulse', preset: 'One a second', params: { depth: 0.7 } }],
  },
  {
    id: 'one-note-many-names-plucked-then-blown',
    name: 'Plucked then blown',
    category: 'plucked',
    description:
      'A course of four strings plucked as the key goes down, heard again backwards in slow swells.',
    preview: SAME_A_AGAIN,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -12.5, ring: 1.2, release: 1 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 900, mix: 0.45 } },
    ],
  },
  {
    id: 'one-note-many-names-whistle-over-the-wires',
    name: 'Whistle over the wires',
    category: 'string',
    description:
      'Single strings driven up to their highest harmonics, thin as a whistle and even, in a small bright chamber.',
    preview: SINKING_D,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { volume: 3.5, wind: 1, gust: 0.05, release: 0.6, width: 0.2 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'one-note-many-names-what-the-note-is-of',
    name: 'What the note is of',
    category: 'drone',
    description:
      'Almost no wind: the strings hum their own fundamentals, warmed by a tube stage with the top rolled away.',
    preview: FOUR_NAMES_G,
    instrument: { deviceId: 'wind-harp', preset: 'Low hum', params: { ring: 3, release: 0.9 } },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9, toneDb: -3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'one-note-many-names-names-in-the-surf',
    name: 'Names in the surf',
    category: 'texture',
    description:
      'A gusty breeze over the strings with plenty of air in it, and slow surf that washes the level up and down.',
    preview: SLOW_PAIR_A,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Sea breeze',
      params: { strings: 1, release: 1.8 },
    },
    effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { mix: 0.9 } }],
  },
  {
    id: 'one-note-many-names-rings-past-its-root',
    name: 'Rings past its root',
    category: 'pad',
    description:
      'Three strings a key that ring for eighteen seconds, so each root stays under the next, blurred but not bent.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { ring: 18, release: 10, hum: 0.4 },
    },
    effects: [{ deviceId: 'melt', preset: 'Still halo', params: { mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-fence-line-naming',
    name: 'Fence line naming',
    category: 'string',
    description:
      'Buzzing wires with a strong hum, quick to die, through a horn loudspeaker some way down a platform.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { ring: 0.8, hum: 1, release: 0.4 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.3, noise: 0 } }],
  },
  {
    id: 'one-note-many-names-mostly-night-air',
    name: 'Mostly night air',
    category: 'texture',
    description:
      'More air than string: a breathy night wind tuned to the keys, heard through fog from far away.',
    preview: SLOW_PAIR_A,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { lull: 0.1, hum: 0, release: 3 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog' }],
  },
  {
    id: 'one-note-many-names-octave-under-the-pluck',
    name: 'Octave under the pluck',
    category: 'plucked',
    description:
      'Short soft plucks with no hum and little wind, each followed by the same note an octave down.',
    preview: SAME_A_AGAIN,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { wind: 0.1, ring: 0.7, touch: 1, release: 0.5 },
    },
    effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.45, mix: 0.5 } }],
  },
  {
    id: 'one-note-many-names-ladder-of-one-a',
    name: 'Ladder of one A',
    category: 'string',
    description:
      'One string a key on which fast wind climbs rung by rung, its overtones thrown off as small sparks.',
    preview: EIGHT_TO_TWELVE_A,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { volume: 1, ring: 0.5, wind: 0.6, release: 1 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'one-note-many-names-course-going-round',
    name: 'Course going round',
    category: 'string',
    description:
      'Four shimmering strings a key at full width, carried round the head once every three seconds.',
    preview: FOUR_CHORDS_E,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { volume: -3, wind: 0.35, gust: 0.2, ring: 7, release: 2 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow circle', params: { rate: 0.35 } }],
  },

  // Drone: the root's own ensemble, from sines to saws, under a held note of the same kind.
  {
    id: 'one-note-many-names-what-does-not-move',
    name: 'What does not move',
    category: 'drone',
    description:
      'An organ-like harmonic series with a filter that keeps only what was sounding a moment ago: the note that stays.',
    preview: FOUR_NAMES_G,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: { partials: 0.6, sub: 0.2, attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what stays', params: { ago: 600, mix: 0.75 } },
    ],
  },
  {
    id: 'one-note-many-names-buzzing-root-strings',
    name: 'Buzzing root strings',
    category: 'drone',
    description:
      'A buzzing harmonic-series drone with a narrow spread, and sixteen learned strings that answer what it plays.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { attack: 0.4, release: 3, width: 0.2, cutoff: 4500 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.45 } }],
  },
  {
    id: 'one-note-many-names-only-a-in-every-octave',
    name: 'Only A in every octave',
    category: 'drone',
    description:
      'Open fifths on every key, put mostly through a filter that rings on the note A alone, in all its octaves.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { attack: 0.5, release: 2, cutoff: 5000, width: 0.9, air: 0.1 },
    },
    effects: [{ deviceId: 'scale-filter', preset: 'One note drone', params: { mix: 0.75 } }],
  },
  {
    id: 'one-note-many-names-dusk-under-a-held-e',
    name: 'Dusk under a held E',
    category: 'drone',
    description:
      'A dark drone of root and fifth, rounded off and slow in, whose tail falls by octaves while it fades.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { shape: 2, partials: 0.4, attack: 0.8, cutoff: 600, release: 1.8 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 12, mix: 0.45 } }],
  },
  {
    id: 'one-note-many-names-eighth-sung-on-octaves',
    name: 'Eighth sung on octaves',
    category: 'drone',
    description:
      'Deep octaves with a narrow resonance that holds the eighth harmonic of a low A as a steady whistle.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { attack: 1.2, release: 4, cutoff: 1600, wave: 0.9, movement: 0.4 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'One held note',
        params: { root: 9, focus: 0.7, drone: 0.9 },
      },
    ],
  },
  {
    id: 'one-note-many-names-crowd-on-one-pitch',
    name: 'Crowd on one pitch',
    category: 'pad',
    description:
      'A full unison ensemble of rounded saws that stays apart in tune, let go with the key and made lush by a chorus.',
    preview: FOUR_CHORDS_E,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        volume: -3.5,
        hold: 0,
        wave: 0.6,
        attack: 0.7,
        release: 2.2,
        cutoff: 1300,
        sub: 0.1,
      },
    },
    effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.5 } }],
  },
  {
    id: 'one-note-many-names-air-with-a-pitch',
    name: 'Air with a pitch',
    category: 'texture',
    description:
      'One soft sine a key with loud tuned air round it, the quiet upper bands pulled forward and left in a thin high space.',
    preview: SLOW_PAIR_A,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { volume: -10, attack: 1, release: 3.5, rate: 0.6 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Air', params: { output: -2 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 8, mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-many-names-pedal-begins-to-sing',
    name: 'Pedal begins to sing',
    category: 'drone',
    description:
      'A dull pedal and its octave with the top taken off, fed back on itself until one overtone of it begins to sing.',
    preview: FOUR_ROOTS_B,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { attack: 0.8, release: 1.4, cutoff: 500, partials: 0.3, wave: 0.3 },
    },
    effects: [{ deviceId: 'howl', preset: 'Low drone', params: { gain: 0.72, mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-swarm-that-agrees-on-g',
    name: 'Swarm that agrees on G',
    category: 'drone',
    description:
      'A wide swarm of saws, all in unison and moving fast, under a low-pass that opens with its own level.',
    preview: FOUR_NAMES_G,
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: { attack: 0.3, release: 1, rate: 1.2, cutoff: 6000 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { envAmount: 50, mix: 0.9 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-note-many-names-octaves-in-glass-dust',
    name: 'Octaves in glass dust',
    category: 'pad',
    description:
      'Octave partials shimmering quickly with no sub under them, smeared into a bright halo above the notes.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { attack: 0.6, release: 1.6, wave: 0 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.5 } }],
  },
  {
    id: 'one-note-many-names-eleventh-turns-tenth',
    name: 'Eleventh turns tenth',
    category: 'drone',
    description:
      'A bare series of sines with no drift, each moved a fraction of a hertz so that the pure intervals turn over.',
    preview: ELEVEN_THEN_TEN,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: {
        wave: 0,
        partials: 0.8,
        attack: 0.5,
        release: 1.6,
        cutoff: 3000,
        sub: 0.2,
        width: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { mode: 2, feedback: 0.2, mix: 0.5 },
      },
    ],
  },
  {
    id: 'one-note-many-names-second-hung-on-an-e',
    name: 'Second hung on an E',
    category: 'drone',
    description:
      'Each key with its major second beside it, soft and wide, swelling in and out every few seconds as breath does.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: { attack: 0.9, release: 4, cutoff: 2200, air: 0.3 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { in: 1.5, out: 2, depth: 0.7, colour: 0.6 } },
    ],
  },

  // Horns: one part tied across every root.
  {
    id: 'one-note-many-names-horn-tied-over-the-bar',
    name: 'Horn tied over the bar',
    category: 'wind',
    description:
      'One French horn, half loud and quick to speak, with the back wall of a hall some way behind it.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: 0, attack: 0.15, release: 0.9, vibrato: 0 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { wander: 0.1 } }],
  },
  {
    id: 'one-note-many-names-section-on-a-single-g',
    name: 'Section on a single G',
    category: 'wind',
    description:
      'A full flugelhorn section in a slow swell, thickened again into a flock of sixteen around the head.',
    preview: THREE_TO_SIX_G,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { volume: -1, attack: 0.7, blow: 0.35, release: 3 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble' }],
  },
  {
    id: 'one-note-many-names-mute-on-the-fifth',
    name: 'Mute on the fifth',
    category: 'wind',
    description:
      'A muted trumpet alone, pinched and short, with one tape repeat and a small plate.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: -0.5, blow: 0.35, release: 0.4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'one-note-many-names-brass-roots-descend',
    name: 'Brass roots descend',
    category: 'bass',
    description:
      'A choir of low brass, slow and dark, with strings an octave up growing in behind every root.',
    preview: THREE_TO_SIX_G,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { volume: -1.5, attack: 0.7, blow: 0.3, release: 1.4 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Low section',
        params: { octaves: 1, fall: 2, mix: 0.4 },
      },
    ],
  },
  {
    id: 'one-note-many-names-slide-to-the-seventh',
    name: 'Slide to the seventh',
    category: 'wind',
    description:
      'A trombone blown hard and cleanly off, through a valve that glows and a tight chamber.',
    preview: FOUR_ROOTS_B,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { blow: 0.7, vibrato: 0.1, release: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'one-note-many-names-fourths-kept-in-step',
    name: 'Fourths kept in step',
    category: 'wind',
    description:
      'Horns doubled a fourth below, dulled on tape and given a five second hall that climbs by octaves, faintly.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { volume: -3.5, attack: 0.5, blow: 0.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-many-names-air-through-the-brass',
    name: 'Air through the brass',
    category: 'texture',
    description:
      'A horn hardly blown at all, mostly breath, its air spread wide and its tones set back.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { volume: -3, attack: 0.8, release: 2 },
    },
    effects: [{ deviceId: 'sift', preset: 'Wide air', params: {} }],
  },
  {
    id: 'one-note-many-names-ballad-on-one-pitch',
    name: 'Ballad on one pitch',
    category: 'wind',
    description:
      'A trumpet with breath in it, straight when the note begins and swaying more the longer it is held.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { volume: -1.5, vibrato: 0, blow: 0.25, breath: 0.4, attack: 0.2, release: 1.4 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 30 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'one-note-many-names-glacier-shifts-below',
    name: 'Glacier shifts below',
    category: 'pad',
    description:
      'Loud horns with a swell of a second and a half and a very long let-go, under a low cathedral that keeps only lows.',
    preview: SLOW_PAIR_A,
    instrument: { deviceId: 'horns', preset: 'Glacial horns', params: { attack: 1.5, release: 8 } },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.5, decay: 16 } }],
  },
  {
    id: 'one-note-many-names-band-in-a-small-set',
    name: 'Band in a small set',
    category: 'wind',
    description: 'A trumpet section with a firm edge, narrowed and worn by a kitchen radio.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { volume: 1, attack: 0.12, blow: 0.55, release: 0.6 },
    },
    effects: [{ deviceId: 'patina', preset: 'Kitchen radio', params: { noise: 0.05, output: 0 } }],
  },
  {
    id: 'one-note-many-names-tuba-says-the-sixth',
    name: 'Tuba says the sixth',
    category: 'bass',
    description:
      'A soft breathy tuba, round and short, with an organ stop of two octaves above set quietly on top.',
    preview: THREE_TO_SIX_G,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { volume: -1, attack: 0.2, release: 0.7 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Sub and silver',
        params: { sub: 0, unison: 0.8, fifteenth: 0.5, mix: 0.6 },
      },
    ],
  },
  {
    id: 'one-note-many-names-muted-roots-held-e',
    name: 'Muted roots, held E',
    category: 'pad',
    description:
      'A muted section that takes half a second to swell in, with a hall after it that rises before it fades.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: 0, attack: 0.6, blow: 0.5, release: 1.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.5 } }],
  },

  // Flute: the still note itself, with three roots inside its own range.
  {
    id: 'one-note-many-names-straight-e-over-three',
    name: 'Straight E over three',
    category: 'wind',
    description:
      'A concert flute with no vibrato and a clean onset, held a little wider on a few cents of detune.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { breath: 0.05, blow: 0.2, attack: 0.2, release: 1 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Cloud', params: { feedback: 0.3 } }],
  },
  {
    id: 'one-note-many-names-same-player-same-e',
    name: 'Same player, same E',
    category: 'wind',
    description:
      'A hard blown flute, bright and short, sounded inside a bottle that rings with it.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { blow: 0.9, vibrato: 0.2, release: 0.15 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.5 } }],
  },
  {
    id: 'one-note-many-names-bamboo-bends-to-an-e',
    name: 'Bamboo bends to an E',
    category: 'wind',
    description:
      'A bamboo flute bent up into each note from two semitones below, its echo hopping up a fifth and down a fourth.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { breath: 0.6, release: 0.5, vibrato: 0 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { feedback: 0.4, mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-many-names-pipes-of-a-e-and-c',
    name: 'Pipes of A, E and C',
    category: 'wind',
    description:
      'Pan pipes with a strong chiff, quick to stop, through a springy tank of three coils.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { volume: -13, breath: 0.3, blow: 0.7, release: 0.15 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-breath-before-naming',
    name: 'Breath before naming',
    category: 'pad',
    description:
      'A low flute that is nearly all air, slow in and slow out, thin dust thrown off it an octave and a fifth up.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.8, release: 3, blow: 0.3, volume: -10 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Fifths above', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-note-many-names-recorder-keeps-the-e',
    name: 'Recorder keeps the E',
    category: 'wind',
    description: 'A small wooden flute, plain as a recorder, turned slowly by six stages of phase.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.06, release: 0.6 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.4, rate: 0.15 } }],
  },
  {
    id: 'one-note-many-names-low-flute-finds-its-root',
    name: 'Low flute finds its root',
    category: 'wind',
    description:
      'A low flute blown firmly with vibrato, with an octave below added to it, in a hall that keeps its lows.',
    preview: ONE_E_LOWER_ROOTS,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { release: 0.7, vibrato: 0.5, chiff: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'one-note-many-names-wood-swell-no-edges',
    name: 'Wood swell, no edges',
    category: 'pad',
    description:
      'A wooden flute that takes a second to open and five to close, every edge blurred away with no tail.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 1.1, release: 5, breath: 0.35 },
    },
    effects: [{ deviceId: 'fog', preset: 'Deep fog' }],
  },
  {
    id: 'one-note-many-names-whispered-in-the-pipes',
    name: 'Whispered in the pipes',
    category: 'texture',
    description:
      'Whispering pipes, almost no tone, sifted through the notes of C so that the pitch comes out of the air.',
    preview: THREE_NAMES_E,
    instrument: { deviceId: 'flute', preset: 'Whisper pipes', params: { release: 1, volume: -9 } },
    effects: [
      { deviceId: 'scale-filter', preset: 'In a major key', params: { ring: 1.2, mix: 0.8 } },
    ],
  },
  {
    id: 'one-note-many-names-bamboo-wide-shake',
    name: 'Bamboo, wide shake',
    category: 'wind',
    description:
      'A bamboo flute with its vibrato wide open, heard again backwards and late, a few softer times over.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.25, release: 1.4, scoop: 10 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.4 } }],
  },

  // Bow: one string held, or plucked again, while the roots move on the strings below.
  {
    id: 'one-note-many-names-bow-stays-on-b',
    name: 'Bow stays on B',
    category: 'string',
    description:
      'A bowed string with a full body and no vibrato, sounded again in a small hard soundboard that rings past the bow.',
    preview: FOUR_ROOTS_B,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.25, release: 1.4, vibrato: 0, brightness: 0.6, position: 0.22 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Wooden body',
        params: { size: 0.5, material: 0.8, mix: 0.85 },
      },
    ],
  },
  {
    id: 'one-note-many-names-glass-bow-on-an-e',
    name: 'Glass bow on an E',
    category: 'string',
    description:
      'A light bow near the bridge, bright and thin, its spectrum stretched very slightly and drifting.',
    preview: FOUR_CHORDS_E,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.9, release: 3, body: 0.1 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Thin glow', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'one-note-many-names-feedback-agrees-on-a',
    name: 'Feedback agrees on A',
    category: 'string',
    description:
      'A string held by a hard-driven sustainer, swelling over a second, caught by a fuzzy wall of short and long reverb.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 1, release: 2 },
    },
    effects: [{ deviceId: 'haze', preset: 'Glowing wall', params: { mix: 0.35, octave: 0 } }],
  },
  {
    id: 'one-note-many-names-plucked-root-kept-a',
    name: 'Plucked root, kept A',
    category: 'plucked',
    description:
      'A felted pluck on a woody body, with six skips of itself dying away closer and closer together.',
    preview: SAME_A_AGAIN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { volume: -5, decay: 3, body: 0.8, release: 0.8 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { first: 350, mix: 0.35 } },
    ],
  },
  {
    id: 'one-note-many-names-wire-that-names',
    name: 'Wire that names',
    category: 'plucked',
    description:
      'A wiry pluck near the bridge that rings for many seconds, put through a fast rotor that stands well off.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -2, brightness: 0.9, decay: 18, release: 4 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Tremolo', params: { distance: 0.5, mix: 0.7 } }],
  },
  {
    id: 'one-note-many-names-two-strings-one-name',
    name: 'Two strings, one name',
    category: 'plucked',
    description:
      'A pluck of two strings twenty-five cents apart that beat as they ring, in a thin veil of haze.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { brightness: 0.4, decay: 12, release: 2 },
    },
    effects: [{ deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-still-tone-soft-floor',
    name: 'Still tone, soft floor',
    category: 'string',
    description:
      'A sustained string with no brightness and no body, all but a sine, sagging in pitch as its tail grows old.',
    preview: ALL_AT_ONCE_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.8, release: 2.5 },
    },
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.45 } }],
  },
  {
    id: 'one-note-many-names-rasp-on-the-seventh',
    name: 'Rasp on the seventh',
    category: 'string',
    description:
      'A hard bow right at the bridge, all rasp, driven through a hot valve that wobbles a little, in a close room.',
    preview: FOUR_ROOTS_B,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { volume: -16.5, attack: 0.15, release: 0.6, body: 0.8 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve' },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'one-note-many-names-flautando-roots-below',
    name: 'Flautando, roots below',
    category: 'string',
    description:
      'A bow with no pressure far up the string, more air than tone, in a hall that whispers back.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.7, release: 1.8 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-section-swims-to-e',
    name: 'Section swims to E',
    category: 'pad',
    description:
      'A detuned bowed section with a wide slow vibrato, set under a little water so that the top wavers.',
    preview: FOUR_CHORDS_E,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.6, release: 2 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under', params: { depth: 0.3, bubbles: 0 } }],
  },

  // Choir: one part never moves while the others change the root or the chord.
  {
    id: 'one-note-many-names-treble-stays-on-e',
    name: 'Treble stays on E',
    category: 'voice',
    description:
      'Bright trebles on an ee with no vibrato, opened outward at the sides and left in an airy hall.',
    preview: FOUR_CHORDS_E,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { volume: -4.5, attack: 0.5, release: 1.5, voice: 1.38, motion: 0 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Everything wide', params: { output: -2 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'one-note-many-names-monks-move-the-root',
    name: 'Monks move the root',
    category: 'voice',
    description:
      'Low voices between oh and oo, dark and even, with an octave below added and a chamber of one second.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { volume: -5, voice: 0.8, attack: 0.6, release: 1.6, tone: 1200 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave down', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'one-note-many-names-solo-over-the-changes',
    name: 'Solo over the changes',
    category: 'voice',
    description:
      'A single singer on an ah with some vibrato, short and central, played from a speaker far down a hall.',
    preview: FOUR_CHORDS_E,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 22, release: 0.3, tone: 12000, width: 0.1 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { noise: 0 } }],
  },
  {
    id: 'one-note-many-names-breath-of-an-e',
    name: 'Breath of an E',
    category: 'texture',
    description:
      'Voices reduced to breath, slow to arrive, smeared into a dark wash with its top taken off.',
    preview: ELEVEN_THEN_TEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { volume: -15, attack: 1.2, release: 1.6, vowel: 0.9 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.7 } }],
  },
  {
    id: 'one-note-many-names-vowels-are-names-too',
    name: 'Vowels are names too',
    category: 'voice',
    description:
      'A choir that drifts through every vowel on its held chord, waved by a slow, random swell of level.',
    preview: ELEVEN_THEN_TEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { volume: -5.5, attack: 0.8, release: 1.5, vowel: 0.45, ensemble: 0.4 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.6 } }],
  },
  {
    id: 'one-note-many-names-hum-around-an-a',
    name: 'Hum around an A',
    category: 'voice',
    description:
      'Closed lips and no top, with five low bowls in fifths on A that ring on when the hum stops.',
    preview: THREE_TO_SIX_A,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { volume: -2, attack: 0.4, release: 0.9, tone: 500, width: 0.3 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.45 } }],
  },
  {
    id: 'one-note-many-names-short-ah-long-memory',
    name: 'Short ah, long memory',
    category: 'voice',
    description:
      'Ahs with hardly an attack or a release, each caught and held by a pad of slow strings made from it.',
    preview: FOUR_CHORDS_E,
    instrument: { deviceId: 'choir', preset: 'Short ah', params: { release: 0.12, vowel: 0.15 } },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 0.5, decay: 4, mix: 0.4 },
      },
    ],
  },
  {
    id: 'one-note-many-names-ee-in-the-cold',
    name: 'Ee in the cold',
    category: 'voice',
    description: 'Breathy narrow trebles on an ee, put out in a thin frozen winter air.',
    preview: FOUR_CHORDS_E,
    instrument: { deviceId: 'choir', preset: 'Breathy ee', params: { attack: 0.4, release: 1.8 } },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { grit: 0.2 } }],
  },
  {
    id: 'one-note-many-names-trebles-in-orbit-of-e',
    name: 'Trebles in orbit of E',
    category: 'voice',
    description:
      'High drifting voices recorded into two unequal loops that turn against each other at the sides.',
    preview: FOUR_CHORDS_E,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.25, release: 1, vowel: 0.3 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.4, feedback: 0.7 } }],
  },

  // Flock: many voices come to the one pitch from wherever they were.
  {
    id: 'one-note-many-names-one-whistle-waits',
    name: 'One whistle waits',
    category: 'voice',
    description:
      'A single gliding sine with no stray, quick to land, with a far echo of it three seconds behind.',
    preview: FIVE_TO_EIGHT_E,
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { gather: 0.12, leave: 0.6, tone: 0.1 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'One far star' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'one-note-many-names-flock-comes-to-d',
    name: 'Flock comes to D',
    category: 'pad',
    description:
      'Eight voices falling in from above within a second and gone in two, with small pieces of them sighing down.',
    preview: SINKING_D,
    instrument: {
      deviceId: 'flock',
      preset: 'Falling in',
      params: { birds: 8, gather: 0.7, leave: 1.8, stray: 0.1, tone: 0.05 },
    },
    effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.4 } }],
  },
  {
    id: 'one-note-many-names-reeds-agree-at-last',
    name: 'Reeds agree at last',
    category: 'pad',
    description:
      'A reedy flock gathered from above and below and held close in tune, pressed hard into the shape of a lower hollow tube.',
    preview: ELEVEN_THEN_TEN,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { stray: 0.05, octaves: 0, gather: 0.8, leave: 1.5, tone: 0.7, width: 0.3 },
    },
    effects: [{ deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.8, shift: -5 } }],
  },
  {
    id: 'one-note-many-names-all-its-octaves',
    name: 'All its octaves',
    category: 'texture',
    description:
      'A glass swarm over every octave, never quite still, cut into grains and laid back as a soft cloud.',
    preview: FOUR_NAMES_G,
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { octaves: 1, stray: 0.1, gather: 0.4, flutter: 4, leave: 1 },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { reverse: 0, mix: 0.5 } }],
  },
  {
    id: 'one-note-many-names-murmur-before-words',
    name: 'Murmur before words',
    category: 'drone',
    description:
      'A low dark murmur of seven loose voices, thick and slow, on an old far-off station with little static.',
    preview: SLOW_PAIR_A,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { gather: 1.2, leave: 2.5, stray: 0.35 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Far station',
        params: { static: 0.1, fading: 0.5, interference: 0 },
      },
    ],
  },

  // Rewind: a note and its root swell backwards into the place where they agree.
  {
    id: 'one-note-many-names-root-arrives-late',
    name: 'Root arrives late',
    category: 'keys',
    description:
      'A piano played backwards that swells for a second and stops dead on its strike, in a faint dull space.',
    preview: SAME_A_AGAIN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { volume: -1.5, swell: 1.2, rise: 0.4, tone: 0.35 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Faint air' }],
  },
  {
    id: 'one-note-many-names-bell-already-named',
    name: 'Bell already named',
    category: 'bell',
    description:
      'A reversed bell that beats widely against itself and strikes as the key is let go, its tail dissolving in a room.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { volume: 6, swell: 1, shimmer: 1, tail: 0.7 },
    },
    effects: [
      {
        deviceId: 'generations',
        preset: 'Slow dissolve',
        params: { length: 1.8, hiss: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'one-note-many-names-bowl-before-the-e',
    name: 'Bowl before the E',
    category: 'bell',
    description:
      'A backwards bowl gathering for a second and a half, then ringing on, its quiet tail raised and opened wide.',
    preview: THREE_NAMES_E,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: 1, swell: 1.4, ghost: 0.4 },
    },
    effects: [{ deviceId: 'lift', preset: 'Opens outward', params: {} }],
  },
]
