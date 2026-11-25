import { type FactoryPreset, type Phrase } from '../types'

// Chains of dominants: each chord is the V7 of the next, so the third and the seventh fall by
// half steps while the roots fall by fifths. Swelling voices take the thirds and sevenths, plucked
// and struck ones the roots. Laid out as five lengths of release by five brightnesses.

// A7, D9, G7, C with its ninth: root below, the tritone stepping down inside, the top moving once.
const LADDER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.45, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 61, gain: 0.4 },
    { atSec: 0, durSec: 1.5, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 3, note: 76, gain: 0.36 },
    { atSec: 1.5, durSec: 1.45, note: 50, gain: 0.5 },
    { atSec: 1.5, durSec: 1.5, note: 60, gain: 0.4 },
    { atSec: 1.5, durSec: 1.5, note: 66, gain: 0.4 },
    { atSec: 3, durSec: 1.45, note: 43, gain: 0.5 },
    { atSec: 3, durSec: 1.5, note: 59, gain: 0.4 },
    { atSec: 3, durSec: 1.5, note: 65, gain: 0.4 },
    { atSec: 3, durSec: 3.3, note: 74, gain: 0.36 },
    { atSec: 4.5, durSec: 1.8, note: 48, gain: 0.5 },
    { atSec: 4.5, durSec: 1.8, note: 60, gain: 0.4 },
    { atSec: 4.5, durSec: 1.8, note: 64, gain: 0.4 },
  ],
}

// E7, A7, D7, G7, C by their thirds and sevenths alone, every pair a half step under the last,
// until the last leading note, B, rises to C.
const GUIDES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 1.3, note: 68, gain: 0.5 },
    { atSec: 1.3, durSec: 1.3, note: 61, gain: 0.5 },
    { atSec: 1.3, durSec: 1.3, note: 67, gain: 0.5 },
    { atSec: 2.6, durSec: 1.3, note: 60, gain: 0.5 },
    { atSec: 2.6, durSec: 1.3, note: 66, gain: 0.5 },
    { atSec: 3.9, durSec: 1.3, note: 59, gain: 0.5 },
    { atSec: 3.9, durSec: 1.3, note: 65, gain: 0.5 },
    { atSec: 5.2, durSec: 1.5, note: 60, gain: 0.5 },
    { atSec: 5.2, durSec: 1.5, note: 64, gain: 0.5 },
  ],
}

// D7, G9, Cmaj7, slow enough for a long bow: the fifth of D becomes the ninth of G.
const TWO_STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 2.1, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 2.1, note: 66, gain: 0.42 },
    { atSec: 0, durSec: 4.2, note: 69, gain: 0.36 },
    { atSec: 2.1, durSec: 2.1, note: 43, gain: 0.5 },
    { atSec: 2.1, durSec: 4.5, note: 59, gain: 0.42 },
    { atSec: 2.1, durSec: 2.1, note: 65, gain: 0.42 },
    { atSec: 4.2, durSec: 2.4, note: 48, gain: 0.5 },
    { atSec: 4.2, durSec: 2.4, note: 64, gain: 0.42 },
    { atSec: 4.2, durSec: 2.4, note: 67, gain: 0.36 },
  ],
}

// The guide tones of A7, D7, G7, C over a held G: a dominant pedal, which leaves the C a six-four.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 43, gain: 0.5 },
    { atSec: 0, durSec: 6.5, note: 55, gain: 0.3 },
    { atSec: 0, durSec: 1.6, note: 61, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 66, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 59, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 65, gain: 0.4 },
    { atSec: 4.8, durSec: 1.7, note: 60, gain: 0.4 },
    { atSec: 4.8, durSec: 1.7, note: 64, gain: 0.4 },
  ],
}

// C, E7, A minor: the V of vi, with G, G sharp and A rising in the tenor.
const SECONDARY: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 2, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 2, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 2, note: 72, gain: 0.4 },
    { atSec: 2, durSec: 2, note: 52, gain: 0.5 },
    { atSec: 2, durSec: 2, note: 56, gain: 0.52 },
    { atSec: 2, durSec: 2, note: 62, gain: 0.36 },
    { atSec: 2, durSec: 2, note: 71, gain: 0.4 },
    { atSec: 4, durSec: 2.3, note: 45, gain: 0.5 },
    { atSec: 4, durSec: 2.3, note: 57, gain: 0.5 },
    { atSec: 4, durSec: 2.3, note: 60, gain: 0.36 },
    { atSec: 4, durSec: 2.3, note: 64, gain: 0.32 },
    { atSec: 4, durSec: 2.3, note: 72, gain: 0.4 },
  ],
}

// Fmaj7, B flat 9, C: the back door, A falling to A flat to G under a top C that never moves.
const BACKDOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 72, gain: 0.4 },
    { atSec: 0, durSec: 2, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 2, note: 57, gain: 0.44 },
    { atSec: 0, durSec: 2, note: 64, gain: 0.4 },
    { atSec: 2, durSec: 2, note: 46, gain: 0.5 },
    { atSec: 2, durSec: 2, note: 56, gain: 0.44 },
    { atSec: 2, durSec: 2, note: 62, gain: 0.4 },
    { atSec: 4, durSec: 2.2, note: 48, gain: 0.5 },
    { atSec: 4, durSec: 2.2, note: 55, gain: 0.44 },
    { atSec: 4, durSec: 2.2, note: 64, gain: 0.4 },
  ],
}

// D9, G7, then A minor where C was promised, then Cmaj7 after all.
const DECEPTIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 66, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 76, gain: 0.38 },
    { atSec: 1.6, durSec: 1.55, note: 43, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 59, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 65, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 74, gain: 0.38 },
    { atSec: 3.2, durSec: 1.55, note: 45, gain: 0.5 },
    { atSec: 3.2, durSec: 3.2, note: 60, gain: 0.4 },
    { atSec: 3.2, durSec: 3.2, note: 64, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 72, gain: 0.38 },
    { atSec: 4.8, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 1.6, note: 71, gain: 0.38 },
  ],
}

// The ground alone, rolled upward: root and fifth of A, D, G and C, the third of C last of all. Five notes of one scale, so a
// held pedal or a long tail can keep them all.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 45, gain: 0.52 },
    { atSec: 0.4, durSec: 1.15, note: 52, gain: 0.42 },
    { atSec: 0.8, durSec: 1.6, note: 64, gain: 0.42 },
    { atSec: 1.6, durSec: 1.55, note: 50, gain: 0.5 },
    { atSec: 2, durSec: 1.15, note: 57, gain: 0.42 },
    { atSec: 2.4, durSec: 1.6, note: 62, gain: 0.42 },
    { atSec: 3.2, durSec: 1.55, note: 55, gain: 0.5 },
    { atSec: 3.6, durSec: 1.15, note: 62, gain: 0.42 },
    { atSec: 4, durSec: 1.6, note: 67, gain: 0.42 },
    { atSec: 4.8, durSec: 1.8, note: 48, gain: 0.52 },
    { atSec: 5.2, durSec: 1.4, note: 55, gain: 0.42 },
    { atSec: 5.6, durSec: 1, note: 64, gain: 0.4 },
  ],
}

// Bass: the roots of E7, A7, D7, G7 and C, up a fourth and down a fifth by turns.
const ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 40, gain: 0.6 },
    { atSec: 1.25, durSec: 1.2, note: 45, gain: 0.6 },
    { atSec: 2.5, durSec: 1.2, note: 38, gain: 0.6 },
    { atSec: 3.75, durSec: 1.2, note: 43, gain: 0.6 },
    { atSec: 5, durSec: 1.5, note: 36, gain: 0.6 },
  ],
}

// Bass: root and fifth of A7, D7 and G7, two to the bar, and the C they lead to.
const TWO_BEAT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 45, gain: 0.62 },
    { atSec: 0.8, durSec: 0.7, note: 40, gain: 0.5 },
    { atSec: 1.6, durSec: 0.75, note: 50, gain: 0.62 },
    { atSec: 2.4, durSec: 0.7, note: 45, gain: 0.5 },
    { atSec: 3.2, durSec: 0.75, note: 43, gain: 0.62 },
    { atSec: 4, durSec: 0.7, note: 38, gain: 0.5 },
    { atSec: 4.8, durSec: 1.6, note: 36, gain: 0.62 },
  ],
}

// Bass in two parts: A, D, G, C with seventh, third, seventh, third above, a line of half steps.
const SHELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 45, gain: 0.56 },
    { atSec: 0, durSec: 1.5, note: 55, gain: 0.46 },
    { atSec: 1.55, durSec: 1.5, note: 38, gain: 0.56 },
    { atSec: 1.55, durSec: 1.5, note: 54, gain: 0.46 },
    { atSec: 3.1, durSec: 1.5, note: 43, gain: 0.56 },
    { atSec: 3.1, durSec: 1.5, note: 53, gain: 0.46 },
    { atSec: 4.65, durSec: 1.8, note: 36, gain: 0.56 },
    { atSec: 4.65, durSec: 1.8, note: 52, gain: 0.46 },
  ],
}

// Bass: each root climbs to its third, and the third leans up a half step into the next root.
const LEADING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.05, note: 33, gain: 0.6 },
    { atSec: 1.1, durSec: 0.52, note: 37, gain: 0.52 },
    { atSec: 1.65, durSec: 1.05, note: 38, gain: 0.6 },
    { atSec: 2.75, durSec: 0.52, note: 42, gain: 0.52 },
    { atSec: 3.3, durSec: 1.05, note: 43, gain: 0.6 },
    { atSec: 4.4, durSec: 0.52, note: 47, gain: 0.52 },
    { atSec: 4.95, durSec: 1.5, note: 48, gain: 0.6 },
  ],
}

// The ladder broken upward, root, guide tones, top, one chord every second and a half.
const BROKEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.45, note: 45, gain: 0.52 },
    { atSec: 0.3, durSec: 1.2, note: 61, gain: 0.42 },
    { atSec: 0.6, durSec: 0.9, note: 67, gain: 0.44 },
    { atSec: 0.9, durSec: 0.6, note: 76, gain: 0.42 },
    { atSec: 1.5, durSec: 1.45, note: 50, gain: 0.52 },
    { atSec: 1.8, durSec: 1.2, note: 60, gain: 0.42 },
    { atSec: 2.1, durSec: 0.9, note: 66, gain: 0.44 },
    { atSec: 2.4, durSec: 0.6, note: 76, gain: 0.42 },
    { atSec: 3, durSec: 1.45, note: 43, gain: 0.52 },
    { atSec: 3.3, durSec: 1.2, note: 59, gain: 0.42 },
    { atSec: 3.6, durSec: 0.9, note: 65, gain: 0.44 },
    { atSec: 3.9, durSec: 0.6, note: 74, gain: 0.42 },
    { atSec: 4.5, durSec: 1.8, note: 48, gain: 0.52 },
    { atSec: 4.8, durSec: 1.5, note: 60, gain: 0.42 },
    { atSec: 5.1, durSec: 1.2, note: 64, gain: 0.44 },
    { atSec: 5.4, durSec: 0.9, note: 74, gain: 0.42 },
  ],
}

// One line for two voices: G to E and C sharp to B in alternate notes, home on C.
const ZIGZAG: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.72, note: 67, gain: 0.55 },
    { atSec: 0.75, durSec: 0.72, note: 61, gain: 0.5 },
    { atSec: 1.5, durSec: 0.72, note: 66, gain: 0.55 },
    { atSec: 2.25, durSec: 0.72, note: 60, gain: 0.5 },
    { atSec: 3, durSec: 0.72, note: 65, gain: 0.55 },
    { atSec: 3.75, durSec: 0.72, note: 59, gain: 0.5 },
    { atSec: 4.5, durSec: 0.72, note: 64, gain: 0.55 },
    { atSec: 5.25, durSec: 1.2, note: 60, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tine piano: guide tones that swell, and whole chords at five releases and five brightnesses.
  {
    id: 'dominant-ladders-half-steps-at-dusk',
    name: 'Half steps at dusk',
    category: 'keys',
    preview: GUIDES,
    description:
      'Dark felted tines with the strike faded out over half a second, let ring a second into a dim hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { release: 1, tone: 0.2, decay: 2.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 520 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { midDecay: 2, lowDecay: 2, mix: 0.35 },
      },
    ],
  },
  {
    id: 'dominant-ladders-seventh-turned-third',
    name: 'Seventh turned third',
    category: 'keys',
    preview: LADDER,
    description:
      'Long soft tines with flue pipes at the note and its octave, faint below, blooming about half a second late.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { release: 1.6, tone: 0.55, tremolo: 0 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { speak: 500, mix: 0.6 } },
      { deviceId: 'ether-reverb', params: { decay: 2.5, size: 0.45, mix: 0.2 } },
    ],
  },
  {
    id: 'dominant-ladders-bell-at-each-rung',
    name: 'Bell at each rung',
    category: 'bell',
    preview: BROKEN,
    description:
      'Bright bell tines, damped short, each note repeated in dotted time by a wide tape echo that wavers a little.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { release: 0.2, tone: 0.95, decay: 0.8 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 450, mix: 0.4 } }],
  },
  {
    id: 'dominant-ladders-turnaround-cabinet',
    name: 'Turnaround cabinet',
    category: 'keys',
    preview: LADDER,
    description:
      'Barking tines that fade fast, out of a horn loudspeaker with its top turned down, in a room a few steps off.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { volume: -4.5, release: 0.2, tone: 0.5, decay: 0.6, bell: 0.6, bark: 0.6 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Station platform',
        params: { drive: 0.3, distance: 0.4, room: 0.5, treble: -0.4 },
      },
    ],
  },
  {
    id: 'dominant-ladders-blurred-resolution',
    name: 'Blurred resolution',
    category: 'pad',
    preview: TWO_STEPS,
    description:
      'Slowly panned tines with every attack washed away by a wide fog of three layers, no tail after it.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { release: 1.2, tone: 0.65 },
    },
    effects: [{ deviceId: 'fog', preset: 'Deep fog' }],
  },
  {
    id: 'dominant-ladders-tritone-in-glass',
    name: 'Tritone in glass',
    category: 'bell',
    preview: ZIGZAG,
    description: 'Glass-bright tines with no bark, dripping through a slack three-spring tank.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { volume: -12.5, decay: 0.9, release: 2 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.4 } }],
  },
  {
    id: 'dominant-ladders-clipped-fifths',
    name: 'Clipped fifths',
    category: 'keys',
    preview: BROKEN,
    description: 'Stubby damped tines, a gated burst of room on every note and nothing after it.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -14.5, tone: 0.7, hardness: 0.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 8 } },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.5, mix: 0.5 } },
    ],
  },
  {
    id: 'dominant-ladders-dampers-sinking',
    name: 'Dampers sinking',
    category: 'keys',
    preview: GROUND,
    description:
      'Tines with the dampers off, their long ring sagging in pitch and darkening like wax as it ages.',
    instrument: { deviceId: 'tine-piano', preset: 'Dampers off', params: { tone: 0.5 } },
    effects: [{ deviceId: 'melt', preset: 'Candle wax' }],
  },
  {
    id: 'dominant-ladders-ground-floor-organ',
    name: 'Ground floor organ',
    category: 'organ',
    preview: PEDAL,
    description:
      'Long dark tines heard only as added pipes, an octave under to two over, through a slow rotary speaker.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tremolo: 0, release: 0.5, tone: 0.3, bell: 0.3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Only the pipes', params: { speak: 250 } },
      { deviceId: 'rotary', preset: 'Soft blend' },
    ],
  },
  {
    id: 'dominant-ladders-notch-descending',
    name: 'Notch descending',
    category: 'keys',
    preview: LADDER,
    description:
      'Tines that cross the room every eight seconds, a twelve-stage phaser sweeping slowly down through them.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { release: 0.8, tone: 0.85 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve stage cloud',
        params: { shape: 3, rate: 0.16, mix: 0.6 },
      },
    ],
  },
  {
    id: 'dominant-ladders-throb-toward-minor',
    name: 'Throb toward minor',
    category: 'keys',
    preview: SECONDARY,
    description:
      'Deep tines in a full tremolo, overdriven by a triode with the top cut at two and a half kilohertz.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremoloRate: 2.6, bark: 0.6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.65, highCut: 2500 } },
    ],
  },
  {
    id: 'dominant-ladders-tines-in-a-tube',
    name: 'Tines in a tube',
    category: 'bell',
    preview: ZIGZAG,
    description:
      'Fast fluttering bright tines played inside a ringing glass tube, mostly the tube being heard.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { tremolo: 0.5, release: 0.5 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.85 } }],
  },
  {
    id: 'dominant-ladders-leading-note-reeds',
    name: 'Leading note reeds',
    category: 'organ',
    preview: SECONDARY,
    description:
      'Reedy barking tines that hold for seconds, turned by a fast rotary speaker driven into growl.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { volume: -17, tremolo: 0, release: 0.3 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Growl', params: { drive: 0.6 } }],
  },
  {
    id: 'dominant-ladders-back-door-carpet',
    name: 'Back door carpet',
    category: 'keys',
    preview: BACKDOOR,
    description:
      'Overdriven tines muffled under a blanket of slow cassette tape with its wow left in.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { volume: -9, tone: 0.2, release: 0.6 },
    },
    effects: [{ deviceId: 'tape', preset: 'Under a blanket', params: { wow: 0.6 } }],
  },
  {
    id: 'dominant-ladders-corridor-of-sevenths',
    name: 'Corridor of sevenths',
    category: 'keys',
    preview: DECEPTIVE,
    description:
      'Plain suitcase tines doubled by a deep three-voice chorus on a slow sweep, their amplifier left clean.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tremolo: 0, drive: 0, release: 0.4, tone: 0.75 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.6 } }],
  },
  {
    id: 'dominant-ladders-strings-after-tines',
    name: 'Strings after tines',
    category: 'pad',
    preview: TWO_STEPS,
    description:
      'Short damped tines, with a low string pad growing from each chord and fading slowly after it.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { decay: 0.5, tone: 0.3 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Dark cellos',
        params: { rise: 0.5, octaves: -0.3, brightness: 1400, mix: 0.7 },
      },
    ],
  },
  {
    id: 'dominant-ladders-stair-top-music-box',
    name: 'Stair-top music box',
    category: 'bell',
    preview: BROKEN,
    description:
      'Bell tines squeezed into the body of a music box, their tops left hard and dry but for a thin plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0, release: 0.5, hardness: 1, decay: 0.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'dominant-ladders-half-step-sigh',
    name: 'Half step sigh',
    category: 'keys',
    preview: SECONDARY,
    description:
      'Soft dark tines, hardly struck, with long pieces of each chord caught and let sink a half step as they fade.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { tone: 0.45, release: 0.3, bark: 0, hardness: 0.15, bell: 0.3 },
    },
    effects: [
      {
        deviceId: 'falling',
        preset: 'Slow sighs',
        params: { fall: -1, size: 1400, density: 2, vary: 0.05, mix: 0.6 },
      },
    ],
  },
  {
    id: 'dominant-ladders-each-chord-swallowed',
    name: 'Each chord swallowed',
    category: 'texture',
    preview: LADDER,
    description:
      'Ringing tines whose reverb rises backwards behind every chord and breaks off, with the strike turned half down.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tone: 0.8, release: 0.1, tremolo: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { tail: 0, mix: 0.7 } },
    ],
  },
  {
    id: 'dominant-ladders-tritones-skipping',
    name: 'Tritones skipping',
    category: 'keys',
    preview: ZIGZAG,
    description:
      'Round tines thrown into echoes that land closer and closer together, crossing from side to side.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { volume: -4.5, tremolo: 0, tone: 0.35, decay: 0.4, release: 0.1 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.55 } }],
  },
  {
    id: 'dominant-ladders-caught-dominant',
    name: 'Caught dominant',
    category: 'pad',
    preview: PEDAL,
    description:
      'Struck tines caught and held as an even string-like pad that slides in under a second to each new chord.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0, tone: 0.5, release: 0.1 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone', params: { ensemble: 0.7, glide: 0.8 } },
    ],
  },
  {
    id: 'dominant-ladders-drowned-cadence',
    name: 'Drowned cadence',
    category: 'keys',
    preview: GROUND,
    description:
      'Undamped tines from deep under slow wavering water, with a few large bubbles off the attacks.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { release: 2, tone: 0.9 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Deep water', params: { waver: 0.6, width: 0.6 } }],
  },
  {
    id: 'dominant-ladders-coarse-grained-fifths',
    name: 'Coarse-grained fifths',
    category: 'keys',
    preview: BACKDOOR,
    description:
      'Tines resampled low and rough, aliasing on the bells, then slowly panned by a wandering tremolo.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremolo: 0, release: 0.4, bell: 0.8, tone: 0.8 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 5200 } },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
    ],
  },
  {
    id: 'dominant-ladders-tone-of-the-third',
    name: 'Tone of the third',
    category: 'pad',
    preview: GUIDES,
    description:
      'Only the sustained tones of soft tines, strikes and air removed, joined two octaves up by sines that swell in late.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { volume: -14, tremolo: 0, tone: 0.3, release: 1 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only', params: { hold: 0.4 } },
      { deviceId: 'sine-shadow', preset: 'Two octaves up', params: { release: 2.5 } },
    ],
  },
  {
    id: 'dominant-ladders-seconds-from-home',
    name: 'Seconds from home',
    category: 'keys',
    preview: TWO_STEPS,
    description:
      'Hard plain tines swelled in from silence, then answered backwards an octave up in long crossfaded pieces.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { tremolo: 0, hardness: 0.9, tone: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.45 } },
    ],
  },

  // String bass: the roots and the ground, from a stopped thud to a string left ringing.
  {
    id: 'dominant-ladders-upright-under-the-arch',
    name: 'Upright under the arch',
    category: 'bass',
    preview: ROOTS,
    description:
      'A round upright, flat of the finger, with a narrow warm spring tank behind every root.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { volume: 6, release: 0.3 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.45, decay: 3 } },
    ],
  },
  {
    id: 'dominant-ladders-fifths-in-the-cupboard',
    name: 'Fifths in the cupboard',
    category: 'bass',
    preview: TWO_BEAT,
    description:
      'Electric bass under the fingers through a combo in a dead cupboard, heard well back from it.',
    instrument: { deviceId: 'string-bass', preset: 'Warm fingers', params: { tone: 0.75 } },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard' }],
  },
  {
    id: 'dominant-ladders-picked-third-doubled',
    name: 'Picked third, doubled',
    category: 'bass',
    preview: SHELLS,
    description:
      'Bright picked strings ringing in pairs, doubled wide by a slow and deep three-voice chorus.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { volume: 0.5, release: 0.5, sustain: 12 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Lush ensemble' }],
  },
  {
    id: 'dominant-ladders-thud-on-the-fifth',
    name: 'Thud on the fifth',
    category: 'bass',
    preview: TWO_BEAT,
    description:
      'Muted strings gone in a moment, fattened by a driven transformer with its lows lifted.',
    instrument: { deviceId: 'string-bass', preset: 'Muted thud', params: { touch: 0.5 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.7, lowBump: 1 } },
    ],
  },
  {
    id: 'dominant-ladders-sway-then-resolve',
    name: 'Sway, then resolve',
    category: 'bass',
    preview: SHELLS,
    description:
      'A singing fretless whose held notes begin straight and sway more the longer they last, in a warm hall.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { sustain: 14, release: 0.8 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 45 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 2.5, mix: 0.3 } },
    ],
  },
  {
    id: 'dominant-ladders-root-in-the-timber',
    name: 'Root in the timber',
    category: 'bass',
    preview: LEADING,
    description:
      'An upright with a long wooden ring, its body doubled by a big soundboard that hums with the roots.',
    instrument: { deviceId: 'string-bass', preset: 'Long wooden ring', params: { touch: 0.1 } },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Wooden body',
        params: { size: 1.8, material: 0.7, mix: 0.75 },
      },
    ],
  },
  {
    id: 'dominant-ladders-flat-strings-on-a-reel',
    name: 'Flat strings on a reel',
    category: 'bass',
    preview: ROOTS,
    description:
      'Dark flat strings recorded hot to tape with the head bump at full, a faint wow on the long notes.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { tone: 0.4, sustain: 3 },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump', params: { speed: 1, drive: 0.75 } }],
  },
  {
    id: 'dominant-ladders-ground-drawn-slowly',
    name: 'Ground drawn slowly',
    category: 'bass',
    preview: ROOTS,
    description:
      'A deep quiet fretless with its pluck faded out over a quarter second, on a dark plate.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: 1, growl: 0.7 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 280 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'dominant-ladders-rattle-on-the-stair',
    name: 'Rattle on the stair',
    category: 'bass',
    preview: LEADING,
    description:
      'A hard pick with the strings rattling, hollowed by an eight-stage phaser that wanders at random.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { volume: 1.5, growl: 0.7, tone: 0.75 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Deep eight-stage', params: { shape: 5, rate: 0.7 } }],
  },
  {
    id: 'dominant-ladders-touch-opens-the-third',
    name: 'Touch opens the third',
    category: 'bass',
    preview: LEADING,
    description:
      'Strings plucked by the bridge through a soft filter that each note opens and that closes over a second.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { volume: 6, sustain: 6, release: 0.4 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Soft bloom' }],
  },
  {
    id: 'dominant-ladders-thumb-and-its-octave',
    name: 'Thumb and its octave',
    category: 'bass',
    preview: ROOTS,
    description:
      'A soft thumb at the neck with a loose detuned octave added above, as on doubled courses of strings.',
    instrument: { deviceId: 'string-bass', preset: 'Thumb at the neck', params: { tone: 0.6 } },
    effects: [{ deviceId: 'octaves', preset: 'Twelve string' }],
  },
  {
    id: 'dominant-ladders-palm-and-dotted-echo',
    name: 'Palm and dotted echo',
    category: 'bass',
    preview: TWO_BEAT,
    description:
      'A muted pick, each short note answered in dotted time by a wide tape echo with most of its lows cut.',
    instrument: { deviceId: 'string-bass', preset: 'Muted pick', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 400, lowCut: 250, mix: 0.45 },
      },
    ],
  },
  {
    id: 'dominant-ladders-all-courses-undamped',
    name: 'All courses undamped',
    category: 'bass',
    preview: SHELLS,
    description:
      'Electric strings never damped, spread by a detuned copy on each side and hung in an open valley.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { volume: -3.5, tone: 0.7, touch: 0.3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { decay: 5, mix: 0.3 } },
    ],
  },
  {
    id: 'dominant-ladders-growl-round-the-circle',
    name: 'Growl round the circle',
    category: 'bass',
    preview: SHELLS,
    description:
      'A growling fretless turned by the slow drum of a rotary cabinet, its lower half favoured.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { volume: -4, release: 0.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
  },
  {
    id: 'dominant-ladders-slap-down-a-fifth',
    name: 'Slap down a fifth',
    category: 'bass',
    preview: TWO_BEAT,
    description:
      'A slapped upright in a small bright room, its crack held down by a fast squeeze and its ring drawn up.',
    instrument: { deviceId: 'string-bass', preset: 'Slapped upright', params: { release: 0.3 } },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pump', params: { makeup: 8 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'dominant-ladders-pedal-stop-upright',
    name: 'Pedal stop upright',
    category: 'bass',
    preview: LEADING,
    description:
      'A soft dark upright with organ pipes an octave under it and two octaves over, speaking just after the pluck.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { volume: 0.5, tone: 0.35 },
    },
    effects: [{ deviceId: 'stops', preset: 'Sub and silver' }],
  },
  {
    id: 'dominant-ladders-cellos-off-the-root',
    name: 'Cellos off the root',
    category: 'string',
    preview: ROOTS,
    description:
      'A damped upright whose every root starts a bowed pad an octave up, levelled until it stands up to the pluck.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { volume: 1, mute: 0.3, tone: 0.3 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'String pad',
        params: { octaves: 0.8, rise: 0.4, brightness: 2400, mix: 0.75 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 12 } },
    ],
  },
  {
    id: 'dominant-ladders-comb-over-the-thirds',
    name: 'Comb over the thirds',
    category: 'bass',
    preview: LEADING,
    description:
      'A bright fretless with almost no growl, combed by a deep slow flanger with three quarters of it fed back.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { growl: 0.1, tone: 0.9, touch: 0.6 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Deep dive' }],
  },
  {
    id: 'dominant-ladders-steady-ground',
    name: 'Steady ground',
    category: 'drone',
    preview: SHELLS,
    description:
      'A thumbed string caught and held as a dark even bed that glides over to each new root.',
    instrument: { deviceId: 'string-bass', preset: 'Thumb at the neck', params: { release: 1 } },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 0.5, glide: 0.8, mix: 0.75 } },
    ],
  },
  {
    id: 'dominant-ladders-room-shut-behind-it',
    name: 'Room shut behind it',
    category: 'bass',
    preview: TWO_BEAT,
    description:
      'An upright pulled near the bridge, with a second and a half of dense room that stops dead behind each note.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { volume: 6, growl: 0.2, tone: 0.5, sustain: 2 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Late wall',
        params: { preDelay: 0, tail: 0, colour: -0.3, mix: 0.5 },
      },
    ],
  },
  {
    id: 'dominant-ladders-furred-fifths',
    name: 'Furred fifths',
    category: 'bass',
    preview: LEADING,
    description:
      'Lightly muted picked strings furred by fuzz in a very small room, then pushed forward with lows and top trimmed.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { mute: 0.2, sustain: 8, release: 0.2 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Small room fuzz', params: { mix: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'dominant-ladders-fifth-hung-in-sines',
    name: 'Fifth hung in sines',
    category: 'bass',
    preview: SHELLS,
    description:
      'A fretless string with pure tones swelling in an octave over its partials and lingering for seconds.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { release: 0.2, tone: 0.5, touch: 0.3 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.6 } }],
  },
  {
    id: 'dominant-ladders-roots-from-a-shellac',
    name: 'Roots from a shellac',
    category: 'bass',
    preview: TWO_BEAT,
    description:
      'A plucked upright from a worn fast-turning record, with crackle, pops and a narrow groove.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { volume: 6, tone: 0.8, touch: 0.5 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Ballroom 78', params: { crackle: 0.3 } }],
  },
  {
    id: 'dominant-ladders-root-under-the-root',
    name: 'Root under the root',
    category: 'bass',
    preview: ROOTS,
    description:
      'Ringing strings with a half-speed copy an octave down pooling beneath them, rolled off from about 650 hertz.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { tone: 0.3, release: 0.8 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Muffled floor' }],
  },
  {
    id: 'dominant-ladders-harmonics-of-the-v',
    name: 'Harmonics of the V',
    category: 'plucked',
    preview: SHELLS,
    description:
      'Picked strings whose partials are stretched apart above the note, so each root rings like a stiff bar.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { volume: -1.5, position: 0.4, release: 2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { mix: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },

  // Chamber strings: the guide tones, bowed, muted and swelling on each change.
  {
    id: 'dominant-ladders-pair-of-bows-descending',
    name: 'Pair of bows descending',
    category: 'string',
    preview: GUIDES,
    description:
      'Two muted players speaking quickly, set well back in a stone stairwell that echoes for over three seconds.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -3.5, attack: 0.12 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'dominant-ladders-sevenths-breathe-out',
    name: 'Sevenths breathe out',
    category: 'string',
    preview: TWO_STEPS,
    description:
      'A muted section swelling over a second and a half, its bands of sound lapping on separate slow tides.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -4.5, attack: 1.4 },
    },
    effects: [{ deviceId: 'currents', preset: 'Breaking waves' }],
  },
  {
    id: 'dominant-ladders-vowel-on-the-third',
    name: 'Vowel on the third',
    category: 'voice',
    preview: TWO_STEPS,
    description:
      'Breathy bows without vibrato, a round vowel pressed on them, answered by a low hall that hums.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.7, air: 0.5 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 5 } },
    ],
  },
  {
    id: 'dominant-ladders-whole-section-on-v',
    name: 'Whole section on V',
    category: 'string',
    preview: LADDER,
    description:
      'Six warm players with wide vibrato pushed into tape, close and thick, their top rounded off.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.25, release: 0.5, vibrato: 18 },
    },
    effects: [{ deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, toneDb: -6 } }],
  },
  {
    id: 'dominant-ladders-bow-stopped-at-the-bar',
    name: 'Bow stopped at the bar',
    category: 'string',
    preview: LADDER,
    description:
      'Hard quick bows, a gate of room under each chord that comes back in steps as it fades.',
    instrument: { deviceId: 'chamber-strings', preset: 'Short bows', params: { release: 0.15 } },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gate steps', params: { time: 0.3, mix: 0.6 } }],
  },
  {
    id: 'dominant-ladders-bridge-over-the-tritone',
    name: 'Bridge over the tritone',
    category: 'string',
    preview: GUIDES,
    description:
      'Three players bowing at the bridge, thin and glassy, an octave bloom rising out of their tail.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: 0, attack: 0.3, release: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'bloom-reverb', preset: 'Octave halo' },
    ],
  },
  {
    id: 'dominant-ladders-lone-bow-to-the-tonic',
    name: 'Lone bow to the tonic',
    category: 'string',
    preview: ZIGZAG,
    description:
      'One close player with vibrato, followed a step later by a copy an octave down, one voice against the other.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: 0, mute: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octaves apart',
        params: { followers: 1, gap: 0.75, interval1: -12, mix: 0.45 },
      },
    ],
  },
  {
    id: 'dominant-ladders-flock-over-the-fifths',
    name: 'Flock over the fifths',
    category: 'pad',
    preview: PEDAL,
    description:
      'A ragged unison turned into sixteen flying copies far off, bending in pitch as they wheel.',
    instrument: { deviceId: 'chamber-strings', preset: 'Ragged unison', params: { attack: 0.5 } },
    effects: [{ deviceId: 'murmuration', preset: 'Cloud far off' }],
  },
  {
    id: 'dominant-ladders-viols-on-the-landing',
    name: 'Viols on the landing',
    category: 'string',
    preview: SECONDARY,
    description: 'A still viol consort made larger in the body, its even tone left dry and narrow.',
    instrument: { deviceId: 'chamber-strings', preset: 'Viol consort' },
    effects: [{ deviceId: 'size', preset: 'Giant', params: { size: 0.7 } }],
  },
  {
    id: 'dominant-ladders-harmonic-above-the-v',
    name: 'Harmonic above the V',
    category: 'drone',
    preview: PEDAL,
    description:
      'A veiled section, a little vibrato let in, with a narrow whistle falling step by step down the overtones of G.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { attack: 0.8, bow: 0.6, mute: 0.4, vibrato: 10 },
    },
    effects: [{ deviceId: 'overtone-singer', preset: 'Falling steps', params: { root: 7 } }],
  },
  {
    id: 'dominant-ladders-frost-on-the-cadence',
    name: 'Frost on the cadence',
    category: 'texture',
    preview: BACKDOOR,
    description:
      'Still bows with no vibrato, frozen by a thin winter of grit and cold space that never turns.',
    instrument: { deviceId: 'chamber-strings', preset: 'Still halo', params: { attack: 1 } },
    effects: [{ deviceId: 'seasons', preset: 'Frozen lake', params: { mix: 1 } }],
  },
  {
    id: 'dominant-ladders-bows-through-a-wall',
    name: 'Bows through a wall',
    category: 'pad',
    preview: TWO_STEPS,
    description:
      'Slow dark bows glowing behind a fuzz and a seven-second reverb, with a third of it fed back.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { volume: -4, attack: 0.8, bow: 0.4 },
    },
    effects: [{ deviceId: 'haze', preset: 'Drone bed', params: { decay: 7 } }],
  },

  // Felt piano: roots and fifths that stay put, and the leading notes that do not.
  {
    id: 'dominant-ladders-g-sharp-in-the-tenor',
    name: 'G sharp in the tenor',
    category: 'keys',
    preview: SECONDARY,
    description:
      'A felted piano, soft pedal down, off a wobbling worn cassette and into a single dark late spring.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { outputDb: -10, reverbMix: 0, soft: 1 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { tone: 0.25, wobble: 0.6, noise: 0.2 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark late coil' },
    ],
  },
  {
    id: 'dominant-ladders-pedal-kept-past-home',
    name: 'Pedal kept past home',
    category: 'keys',
    preview: GROUND,
    description:
      'A pedalled piano whose strings wake a bank of strings tuned to whatever notes it learns from you.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -17.5, reverbMix: 0 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.55 } }],
  },
  {
    id: 'dominant-ladders-glass-stair-to-c',
    name: 'Glass stair to C',
    category: 'keys',
    preview: BROKEN,
    description:
      'A bare hard piano, every note followed by twelve bright echoes on a bent ladder that comes round again.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -8.5, reverbMix: 0, hardness: 0.9 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Bright rungs', params: { span: 1400, mix: 0.7 } },
    ],
  },
  {
    id: 'dominant-ladders-parlour-turnback',
    name: 'Parlour turnback',
    category: 'keys',
    preview: LADDER,
    description:
      'An old upright out of tune with its action rattling, thin and narrow out of a kitchen radio.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -13.5, reverbMix: 0 },
    },
    effects: [{ deviceId: 'patina', preset: 'Kitchen radio' }],
  },
  {
    id: 'dominant-ladders-promise-not-kept',
    name: 'Promise, not kept',
    category: 'keys',
    preview: DECEPTIVE,
    description:
      'A still half-pedalled piano, each chord unfolding slowly from its lowest band up to its highest.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -13, sustain: 0.6 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1200, mix: 0.55 } }],
  },
  {
    id: 'dominant-ladders-thud-then-the-ninth',
    name: 'Thud, then the ninth',
    category: 'keys',
    preview: LADDER,
    description:
      'The softest hammers with a heavy thump, each strike a tenth of a second after its tone, the top opened wide.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -9.5, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strike just after', params: { late: 120 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'dominant-ladders-two-floors-below-home',
    name: 'Two floors below home',
    category: 'keys',
    preview: TWO_STEPS,
    description:
      'A driven grand heard through fog at the far end of a house, dark and narrow, with a room around it.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { outputDb: -11.5, reverbMix: 0 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog' }],
  },
  {
    id: 'dominant-ladders-fifths-washed-together',
    name: 'Fifths washed together',
    category: 'pad',
    preview: GROUND,
    description:
      'A blurred piano with the pedal always down, swelled in over nearly a second and kept as one held sheet.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -6.5, reverbMix: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'spectral-blur', preset: 'Clean sustain' },
    ],
  },
  {
    id: 'dominant-ladders-worn-thumbs-on-fifths',
    name: 'Worn thumbs on fifths',
    category: 'keys',
    preview: GROUND,
    description:
      'A grimy piano in mono through a bedside radio, pulsed by a slow harmonic tremolo.',
    instrument: { deviceId: 'felt-piano', preset: 'Worn mono', params: { reverbMix: 0 } },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.2 } },
    ],
  },

  // Wavetable: guide tones as slow pads, from a still sine to a thick fan of saws.
  {
    id: 'dominant-ladders-two-sines-a-hair-apart',
    name: 'Two sines, a hair apart',
    category: 'pad',
    preview: GUIDES,
    description:
      'A pair of beating sines speaking softly, swung round the head in a slow figure of eight.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { volume: -5.5, attack: 0.3, release: 1.2 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow eight' }],
  },
  {
    id: 'dominant-ladders-ah-for-the-dominant',
    name: 'Ah for the dominant',
    category: 'voice',
    preview: TWO_STEPS,
    description:
      'A vowel table opening over a second, a fast shallow vibrato coming in late, faint octaves swelling above it.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.9, release: 2, sub: 0 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Wide shake', params: { depth: 18 } },
      { deviceId: 'octaves', preset: 'Slow halo' },
    ],
  },
  {
    id: 'dominant-ladders-reeds-on-the-pedal-g',
    name: 'Reeds on the pedal G',
    category: 'organ',
    preview: PEDAL,
    description:
      'A dark reed table over a strong sub, speaking at once, spun by heavy fast rotors, its body scooped out.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { volume: -18, cutoff: 1300, sub: 0.9, position: 0.6, attack: 0.05, release: 0.4 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Heavy rotors' },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'dominant-ladders-cadence-under-glass',
    name: 'Cadence under glass',
    category: 'bell',
    preview: BROKEN,
    description:
      'Glassy struck wavetable keys, throwing off a steady rain of small sparks above the notes.',
    instrument: { deviceId: 'wavetable', preset: 'Glass bell keys', params: { release: 1.6 } },
    effects: [{ deviceId: 'glints', preset: 'Steady rain' }],
  },
  {
    id: 'dominant-ladders-saws-down-the-stairwell',
    name: 'Saws down the stairwell',
    category: 'pad',
    preview: LADDER,
    description:
      'Thick detuned saws with a short tail, filtered by a slow low-pass sweep and driven a little into it.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.08, release: 0.6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Dub sweep', params: { resonance: 1.5, driveDb: 4 } },
    ],
  },
  {
    id: 'dominant-ladders-drifting-back-door',
    name: 'Drifting back door',
    category: 'pad',
    preview: BACKDOOR,
    description:
      'A hollow table drifting under a low-pass, its bands catching the light in small separate tremolos.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.9, release: 3, cutoff: 3500 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Wide twinkle' }],
  },
  {
    id: 'dominant-ladders-pulse-then-a-fourth-low',
    name: 'Pulse, then a fourth low',
    category: 'keys',
    preview: ZIGZAG,
    description:
      'A narrow pulse, quick to speak, its grains repeating a fourth lower each time as they fade.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { volume: -4.5, cutoff: 3000 },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Falling fourths' }],
  },
  {
    id: 'dominant-ladders-overtones-of-a-promise',
    name: 'Overtones of a promise',
    category: 'texture',
    preview: DECEPTIVE,
    description:
      'A resonant spectral table whose overtones are lifted out of hiding, then rung by a small bright tank.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { attack: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.3 } },
    ],
  },

  // West coast: single lines that fall by half steps, struck, plucked or slowly folded.
  {
    id: 'dominant-ladders-wooden-rungs',
    name: 'Wooden rungs',
    category: 'plucked',
    preview: ZIGZAG,
    description:
      'A woody low-pass-gate pluck with echoes that hop up a fifth and down a fourth as the clock steps.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { volume: 2.5, chance: 0 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Fifth hop' }],
  },
  {
    id: 'dominant-ladders-mallet-half-step-rest',
    name: 'Mallet, half step, rest',
    category: 'bell',
    preview: ZIGZAG,
    description:
      'A soft round mallet among bowls tuned to C major, which ring on after the notes that are in it.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: 3, decay: 0.8 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Bowl table', params: { scale: 2, ring: 5 } }],
  },
  {
    id: 'dominant-ladders-folding-to-the-tonic',
    name: 'Folding to the tonic',
    category: 'drone',
    preview: PEDAL,
    description:
      'A slowly folding tone speaking in half a second, its middle band pulsed three times a second, its lows steady.',
    instrument: { deviceId: 'west-coast', preset: 'Folding drone', params: { attack: 0.5 } },
    effects: [{ deviceId: 'band-pulse', preset: 'Three a second' }],
  },
  {
    id: 'dominant-ladders-gong-before-the-bar',
    name: 'Gong before the bar',
    category: 'bell',
    preview: GROUND,
    description:
      'A long gong of frequency modulation, sunk an octave under its own fainter voice in a low dark hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { volume: -3, fm: 0.5, decay: 5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone', params: { dry: 0.35 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 8 } },
    ],
  },
  {
    id: 'dominant-ladders-harp-of-leading-notes',
    name: 'Harp of leading notes',
    category: 'plucked',
    preview: BROKEN,
    description:
      'A bright folded pluck, spread into small echoes that cluster and drift across the whole width.',
    instrument: { deviceId: 'west-coast', preset: 'Bright harp', params: { volume: -2.5 } },
    effects: [
      { deviceId: 'constellation', preset: 'Shimmer field', params: { again: 0.3, mix: 0.4 } },
    ],
  },
  {
    id: 'dominant-ladders-pipes-at-the-full-close',
    name: 'Pipes at the full close',
    category: 'wind',
    preview: TWO_STEPS,
    description:
      'Hollow modulated pipes speaking over a third of a second, played inside a shell with its breath noise up.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { volume: -7.5, attack: 0.35 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Shell to the ear' }],
  },
  {
    id: 'dominant-ladders-round-bass-five-roots',
    name: 'Round bass, five roots',
    category: 'bass',
    preview: ROOTS,
    description:
      'A folded bass, short and dry, its bite gone in a moment, thickened by a tube preamp driven hard with the top tilted down.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { decay: 0.8, fold: 0.7, fm: 0.4, timbreEnv: 1, colour: 0.25 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 16, toneDb: -2 } },
    ],
  },
  {
    id: 'dominant-ladders-thumbs-on-the-tritone',
    name: 'Thumbs on the tritone',
    category: 'plucked',
    preview: BROKEN,
    description:
      'A short buzzing thumb-piano tone tapped into a pattering swarm of echoes in a small bright cave.',
    instrument: { deviceId: 'west-coast', preset: 'Thumb piano', params: { volume: 3 } },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.45 } }],
  },

  // Aurora: whole dominants as brass and strings that keep swelling while they are held.
  {
    id: 'dominant-ladders-brass-on-the-v-of-v',
    name: 'Brass on the V of V',
    category: 'pad',
    preview: TWO_STEPS,
    description:
      'Slow brass with a strong overshoot, levelled by a close squeeze so that each swell leans on its chord.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { volume: -4.5, attack: 0.25, contour: 0.9, release: 1.2 },
    },
    effects: [{ deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 6 } }],
  },
  {
    id: 'dominant-ladders-horn-pair-falling',
    name: 'Horn pair, falling',
    category: 'wind',
    preview: GUIDES,
    description:
      'Soft horns speaking in a third of a second, their lows left out, heard mostly as a plate at a distance.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.3, release: 1.5, lowCut: 260 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Distant haze' }],
  },
  {
    id: 'dominant-ladders-silver-detour-from-v',
    name: 'Silver detour from V',
    category: 'string',
    preview: DECEPTIVE,
    description:
      'Thin bright synthetic strings with the lows cut away, opened wide at the top, a still four-second halo behind them.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.4, release: 1.5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Hazy edges' },
      { deviceId: 'melt', preset: 'Still halo' },
    ],
  },
  {
    id: 'dominant-ladders-tritone-in-metal',
    name: 'Tritone in metal',
    category: 'pad',
    preview: LADDER,
    description:
      'Ring-modulated brass that speaks quickly, its pitch split between the ears by a few hertz and fed back.',
    instrument: { deviceId: 'aurora', preset: 'Metal dawn', params: { release: 2 } },
    effects: [{ deviceId: 'freq-shifter', preset: 'Split sky' }],
  },
  {
    id: 'dominant-ladders-short-brass-at-the-turn',
    name: 'Short brass at the turn',
    category: 'keys',
    preview: ZIGZAG,
    description:
      'Short brass with a hard opening and no swell, answered backwards an octave below in pieces of under a second.',
    instrument: { deviceId: 'aurora', preset: 'Short brass', params: { volume: -5, release: 0.3 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 750 } }],
  },
  {
    id: 'dominant-ladders-vowel-opens-third-falls',
    name: 'Vowel opens, third falls',
    category: 'voice',
    preview: TWO_STEPS,
    description:
      'A resonant pad that opens from a hum to a vowel, gathered into a hall of small high thin vowels.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.8, release: 2 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'High ee' }],
  },
  {
    id: 'dominant-ladders-reeds-drift-from-the-v',
    name: 'Reeds drift from the V',
    category: 'organ',
    preview: BACKDOOR,
    description:
      'Loosely tuned reeds, with a thin medium-wave copy of them fading and hissing underneath.',
    instrument: { deviceId: 'aurora', preset: 'Loose reeds', params: { attack: 0.15 } },
    effects: [{ deviceId: 'radio', preset: 'Hint of static' }],
  },

  // Ember: the ground itself, and dominants as dark or hollow pads.
  {
    id: 'dominant-ladders-ember-on-the-bass-stair',
    name: 'Ember on the bass stair',
    category: 'bass',
    preview: LEADING,
    description:
      'A warm one-voice bass that glides between roots, its echo two heads of tape galloping behind it.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm Bass',
      params: { glide: 0.08, ampRelease: 0.3 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop', params: { lowCut: 200 } }],
  },
  {
    id: 'dominant-ladders-dominant-in-the-dark',
    name: 'Dominant in the dark',
    category: 'drone',
    preview: PEDAL,
    description:
      'A dark low drone with its filter near shut, slowly breathing open and shut in level and colour.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 0.8, ampRelease: 2, cutoff: 400 },
    },
    effects: [{ deviceId: 'breath', preset: 'Calm breath' }],
  },
  {
    id: 'dominant-ladders-hollow-sevenths',
    name: 'Hollow sevenths',
    category: 'pad',
    preview: LADDER,
    description: 'A hollow pulse-and-triangle pad with a fast throb from a phaser of four stages.',
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { volume: -4, ampAttack: 0.2, ampRelease: 0.8 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Fast throb' }],
  },
  {
    id: 'dominant-ladders-strings-for-a-soft-close',
    name: 'Strings for a soft close',
    category: 'string',
    preview: TWO_STEPS,
    description:
      'Slow saw strings in three detuned voices doubled by drifting tape, in a long hall that climbs an octave a pass.',
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: { ampAttack: 0.8, ampRelease: 1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'shimmer', preset: 'Fifths', params: { interval: 0, decay: 6 } },
    ],
  },
  {
    id: 'dominant-ladders-plucked-out-of-the-v',
    name: 'Plucked out of the V',
    category: 'plucked',
    preview: BROKEN,
    description:
      'A short glassy filter pluck, replayed as little stacked loops an octave up and dying away.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { volume: 6, cutoff: 700, ampDecay: 0.6 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Octave stack' }],
  },
  {
    id: 'dominant-ladders-air-over-the-turnaround',
    name: 'Air over the turnaround',
    category: 'pad',
    preview: DECEPTIVE,
    description:
      'An airy saw pad with noise in it, left out in a light wind that moves its level and its tone.',
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: { ampAttack: 0.5, ampRelease: 1.5, noiseLevel: 0.08 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day' }],
  },
]
