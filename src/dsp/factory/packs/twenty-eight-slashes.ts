import { type FactoryPreset, type Phrase } from '../types'

// Twenty-Eight Slashes: the white-key triads over the four basses each does not own. Upper voices
// to carry a triad in close, open or bell-top spacing, and floors to put under it. Laid out by which
// layer a voice is for, how it starts, and how bright it stays over a bass it disagrees with.

// Seven phrases hold one triad over its four foreign floors: together they are the twenty-eight.

// G/F, F/E, Em/D, Dm/C: each triad a step above its own bass, close and doubled at the octave, rolled.
const STEPPING_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 41, gain: 0.45 },
    { atSec: 0.05, durSec: 1.5, note: 55, gain: 0.34 },
    { atSec: 0.1, durSec: 1.45, note: 59, gain: 0.34 },
    { atSec: 0.15, durSec: 1.4, note: 62, gain: 0.34 },
    { atSec: 0.2, durSec: 1.35, note: 67, gain: 0.34 },
    { atSec: 0.25, durSec: 1.3, note: 71, gain: 0.34 },
    { atSec: 1.55, durSec: 1.55, note: 40, gain: 0.45 },
    { atSec: 1.6, durSec: 1.5, note: 53, gain: 0.34 },
    { atSec: 1.65, durSec: 1.45, note: 57, gain: 0.34 },
    { atSec: 1.7, durSec: 1.4, note: 60, gain: 0.34 },
    { atSec: 1.75, durSec: 1.35, note: 65, gain: 0.34 },
    { atSec: 1.8, durSec: 1.3, note: 69, gain: 0.34 },
    { atSec: 3.1, durSec: 1.55, note: 38, gain: 0.45 },
    { atSec: 3.15, durSec: 1.5, note: 52, gain: 0.34 },
    { atSec: 3.2, durSec: 1.45, note: 55, gain: 0.34 },
    { atSec: 3.25, durSec: 1.4, note: 59, gain: 0.34 },
    { atSec: 3.3, durSec: 1.35, note: 64, gain: 0.34 },
    { atSec: 3.35, durSec: 1.3, note: 67, gain: 0.34 },
    { atSec: 4.65, durSec: 1.75, note: 36, gain: 0.45 },
    { atSec: 4.7, durSec: 1.7, note: 53, gain: 0.34 },
    { atSec: 4.75, durSec: 1.65, note: 57, gain: 0.34 },
    { atSec: 4.8, durSec: 1.6, note: 62, gain: 0.34 },
    { atSec: 4.85, durSec: 1.55, note: 65, gain: 0.34 },
    { atSec: 4.9, durSec: 1.5, note: 69, gain: 0.34 },
  ],
}

// E minor held close while the floor goes F, D, A, C: Em/F, Em/D, Em/A, Em/C.
const E_MINOR_FLOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 71, gain: 0.36 },
    { atSec: 0, durSec: 1.6, note: 53, gain: 0.48 },
    { atSec: 1.6, durSec: 1.6, note: 50, gain: 0.48 },
    { atSec: 3.2, durSec: 1.6, note: 45, gain: 0.48 },
    { atSec: 4.8, durSec: 1.6, note: 48, gain: 0.48 },
  ],
}

// C major held close over F, D, B, A: C/F, C/D, C/B, then the bass alone resolves B to A, C/A.
const C_FLOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 1.6, note: 41, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 38, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 35, gain: 0.5 },
    { atSec: 4.8, durSec: 1.6, note: 33, gain: 0.5 },
  ],
}

// D minor held close, the floor sinking G, E, C, B: Dm/G, Dm/E, Dm/C, Dm/B.
const D_MINOR_FLOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 62, gain: 0.38 },
    { atSec: 0, durSec: 6.4, note: 65, gain: 0.38 },
    { atSec: 0, durSec: 6.4, note: 69, gain: 0.38 },
    { atSec: 0, durSec: 1.6, note: 55, gain: 0.46 },
    { atSec: 1.6, durSec: 1.6, note: 52, gain: 0.46 },
    { atSec: 3.2, durSec: 1.6, note: 48, gain: 0.46 },
    { atSec: 4.8, durSec: 1.6, note: 47, gain: 0.46 },
  ],
}

// F major held open (A, F, C upwards), the floor falling E, D, B, G: F/E with its minor ninth, F/D, F/B, F/G.
const F_FLOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 57, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 65, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 72, gain: 0.36 },
    { atSec: 0, durSec: 1.6, note: 52, gain: 0.46 },
    { atSec: 1.6, durSec: 1.6, note: 50, gain: 0.46 },
    { atSec: 3.2, durSec: 1.6, note: 47, gain: 0.46 },
    { atSec: 4.8, durSec: 1.6, note: 43, gain: 0.46 },
  ],
}

// G major held open (B, G, D upwards), the floor climbing A, C, E, F: G/A, G/C, G/E and the Lydian G/F.
const G_FLOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 59, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 74, gain: 0.36 },
    { atSec: 0, durSec: 1.6, note: 45, gain: 0.46 },
    { atSec: 1.6, durSec: 1.6, note: 48, gain: 0.46 },
    { atSec: 3.2, durSec: 1.6, note: 52, gain: 0.46 },
    { atSec: 4.8, durSec: 1.6, note: 53, gain: 0.46 },
  ],
}

// A minor held open with its own notes as bells above, the floor climbing F, G, B, D: Am/F, Am/G, Am/B, Am/D.
const A_MINOR_FLOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 57, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 6.4, note: 72, gain: 0.36 },
    { atSec: 0, durSec: 1.6, note: 41, gain: 0.46 },
    { atSec: 1.6, durSec: 1.6, note: 43, gain: 0.46 },
    { atSec: 3.2, durSec: 1.6, note: 47, gain: 0.46 },
    { atSec: 4.8, durSec: 1.6, note: 50, gain: 0.46 },
    { atSec: 0.8, durSec: 1.4, note: 81, gain: 0.3 },
    { atSec: 2.4, durSec: 1.4, note: 84, gain: 0.28 },
    { atSec: 4, durSec: 1.4, note: 88, gain: 0.26 },
    { atSec: 5.6, durSec: 0.8, note: 84, gain: 0.24 },
  ],
}

// B diminished held close and quiet over E, A, G, C: Bdim/E, Bdim/A, Bdim/G, Bdim/C.
const B_DIMINISHED_FLOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 59, gain: 0.28 },
    { atSec: 0, durSec: 6.4, note: 62, gain: 0.28 },
    { atSec: 0, durSec: 6.4, note: 65, gain: 0.28 },
    { atSec: 0, durSec: 1.6, note: 40, gain: 0.44 },
    { atSec: 1.6, durSec: 1.6, note: 45, gain: 0.44 },
    { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.44 },
    { atSec: 4.8, durSec: 1.6, note: 36, gain: 0.44 },
  ],
}

// Am/D, G/C, F/B, Em/A in open spacing: each triad stands on a fifth over its bass (B to F diminished), its own fifth ringing on top, E, D, C, B.
const BELL_TOPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 38, gain: 0.46 },
    { atSec: 0, durSec: 1.55, note: 57, gain: 0.34 },
    { atSec: 0, durSec: 1.55, note: 64, gain: 0.34 },
    { atSec: 0, durSec: 1.55, note: 72, gain: 0.34 },
    { atSec: 1.55, durSec: 1.55, note: 36, gain: 0.46 },
    { atSec: 1.55, durSec: 1.55, note: 55, gain: 0.34 },
    { atSec: 1.55, durSec: 1.55, note: 62, gain: 0.34 },
    { atSec: 1.55, durSec: 1.55, note: 71, gain: 0.34 },
    { atSec: 3.1, durSec: 1.55, note: 35, gain: 0.46 },
    { atSec: 3.1, durSec: 1.55, note: 53, gain: 0.34 },
    { atSec: 3.1, durSec: 1.55, note: 60, gain: 0.34 },
    { atSec: 3.1, durSec: 1.55, note: 69, gain: 0.34 },
    { atSec: 4.65, durSec: 1.75, note: 33, gain: 0.46 },
    { atSec: 4.65, durSec: 1.75, note: 52, gain: 0.34 },
    { atSec: 4.65, durSec: 1.75, note: 59, gain: 0.34 },
    { atSec: 4.65, durSec: 1.75, note: 67, gain: 0.34 },
    { atSec: 0.75, durSec: 0.95, note: 88, gain: 0.26 },
    { atSec: 2.3, durSec: 0.95, note: 86, gain: 0.26 },
    { atSec: 3.85, durSec: 0.95, note: 84, gain: 0.26 },
    { atSec: 5.4, durSec: 0.95, note: 83, gain: 0.26 },
  ],
}

// G/C, F/D, Dm/E, C/F: open triads sink while the floor climbs C, D, E, F to meet them, a breath after each.
const CONTRARY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 36, gain: 0.46 },
    { atSec: 0, durSec: 1.3, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 1.3, note: 62, gain: 0.36 },
    { atSec: 0, durSec: 1.3, note: 71, gain: 0.36 },
    { atSec: 1.6, durSec: 1.3, note: 38, gain: 0.46 },
    { atSec: 1.6, durSec: 1.3, note: 53, gain: 0.36 },
    { atSec: 1.6, durSec: 1.3, note: 60, gain: 0.36 },
    { atSec: 1.6, durSec: 1.3, note: 69, gain: 0.36 },
    { atSec: 3.2, durSec: 1.3, note: 40, gain: 0.46 },
    { atSec: 3.2, durSec: 1.3, note: 50, gain: 0.36 },
    { atSec: 3.2, durSec: 1.3, note: 57, gain: 0.36 },
    { atSec: 3.2, durSec: 1.3, note: 65, gain: 0.36 },
    { atSec: 4.8, durSec: 1.3, note: 41, gain: 0.46 },
    { atSec: 4.8, durSec: 1.3, note: 48, gain: 0.36 },
    { atSec: 4.8, durSec: 1.3, note: 55, gain: 0.36 },
    { atSec: 4.8, durSec: 1.3, note: 64, gain: 0.36 },
  ],
}

// G/F, F/E, Em/D, Dm/C on one bass: the floor held, its foreign triad broken above it note by note.
const BROKEN_STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 29, gain: 0.6 },
    { atSec: 0.4, durSec: 0.36, note: 43, gain: 0.46 },
    { atSec: 0.78, durSec: 0.36, note: 47, gain: 0.46 },
    { atSec: 1.16, durSec: 0.36, note: 50, gain: 0.46 },
    { atSec: 1.6, durSec: 1.55, note: 28, gain: 0.6 },
    { atSec: 2, durSec: 0.36, note: 41, gain: 0.46 },
    { atSec: 2.38, durSec: 0.36, note: 45, gain: 0.46 },
    { atSec: 2.76, durSec: 0.36, note: 48, gain: 0.46 },
    { atSec: 3.2, durSec: 1.55, note: 38, gain: 0.6 },
    { atSec: 3.6, durSec: 0.36, note: 47, gain: 0.46 },
    { atSec: 3.98, durSec: 0.36, note: 52, gain: 0.46 },
    { atSec: 4.36, durSec: 0.36, note: 55, gain: 0.46 },
    { atSec: 4.8, durSec: 1.55, note: 36, gain: 0.6 },
    { atSec: 5.2, durSec: 0.36, note: 45, gain: 0.46 },
    { atSec: 5.58, durSec: 0.36, note: 50, gain: 0.46 },
    { atSec: 5.96, durSec: 0.36, note: 53, gain: 0.46 },
  ],
}

// C major broken up and down over F, D, B, A: C/F, C/D, C/B, and B falling to A under the same triad.
const BROKEN_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.58, note: 41, gain: 0.6 },
    { atSec: 0.4, durSec: 1.18, note: 48, gain: 0.44 },
    { atSec: 0.8, durSec: 0.78, note: 52, gain: 0.44 },
    { atSec: 1.2, durSec: 0.38, note: 55, gain: 0.44 },
    { atSec: 1.6, durSec: 1.58, note: 38, gain: 0.6 },
    { atSec: 2, durSec: 1.18, note: 55, gain: 0.44 },
    { atSec: 2.4, durSec: 0.78, note: 52, gain: 0.44 },
    { atSec: 2.8, durSec: 0.38, note: 48, gain: 0.44 },
    { atSec: 3.2, durSec: 1.58, note: 35, gain: 0.6 },
    { atSec: 3.6, durSec: 1.18, note: 48, gain: 0.44 },
    { atSec: 4, durSec: 0.78, note: 52, gain: 0.44 },
    { atSec: 4.4, durSec: 0.38, note: 55, gain: 0.44 },
    { atSec: 4.8, durSec: 1.58, note: 33, gain: 0.6 },
    { atSec: 5.2, durSec: 1.18, note: 55, gain: 0.44 },
    { atSec: 5.6, durSec: 0.78, note: 52, gain: 0.44 },
    { atSec: 6, durSec: 0.38, note: 48, gain: 0.44 },
  ],
}

// G/F, Am/G, Bdim/A, C/B for one voice: each floor, then the triad a step above it; last the floor falls to A, C/A.
const STEPPING_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.55, note: 41, gain: 0.6 },
    { atSec: 0.55, durSec: 0.3, note: 43, gain: 0.5 },
    { atSec: 0.85, durSec: 0.3, note: 47, gain: 0.5 },
    { atSec: 1.15, durSec: 0.3, note: 50, gain: 0.5 },
    { atSec: 1.45, durSec: 0.55, note: 43, gain: 0.6 },
    { atSec: 2, durSec: 0.3, note: 45, gain: 0.5 },
    { atSec: 2.3, durSec: 0.3, note: 48, gain: 0.5 },
    { atSec: 2.6, durSec: 0.3, note: 52, gain: 0.5 },
    { atSec: 2.9, durSec: 0.55, note: 45, gain: 0.6 },
    { atSec: 3.45, durSec: 0.3, note: 47, gain: 0.5 },
    { atSec: 3.75, durSec: 0.3, note: 50, gain: 0.5 },
    { atSec: 4.05, durSec: 0.3, note: 53, gain: 0.5 },
    { atSec: 4.35, durSec: 0.55, note: 47, gain: 0.6 },
    { atSec: 4.9, durSec: 0.3, note: 48, gain: 0.5 },
    { atSec: 5.2, durSec: 0.3, note: 52, gain: 0.5 },
    { atSec: 5.5, durSec: 0.3, note: 55, gain: 0.5 },
    { atSec: 5.8, durSec: 1.1, note: 45, gain: 0.6 },
  ],
}

// The floor under a held C triad: F, D, B, and the long fall to A that turns C/B into C/A.
const B_FALLS_TO_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 41, gain: 0.6 },
    { atSec: 1.3, durSec: 1.3, note: 38, gain: 0.58 },
    { atSec: 2.6, durSec: 1.8, note: 35, gain: 0.56 },
    { atSec: 4.4, durSec: 2, note: 33, gain: 0.54 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'twenty-eight-slashes-ceiling-of-tines',
    name: 'Ceiling of tines',
    category: 'keys',
    description:
      'Undamped tines with a bright attack and thinned lows, ringing for seconds into a long plate above whatever floor is under them.',
    preview: STEPPING_DOWN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.65, hardness: 0.55, tone: 0.6 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.34, damping: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Open', params: { low: -4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-attic-window-tines',
    name: 'Attic window tines',
    category: 'bell',
    description:
      'Hard glassy tines, all bell and no bark, each strike skipping away in quick echoes that cross the field.',
    preview: BELL_TOPS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 0.8, release: 1.8 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Ball on glass', params: { throw: 0.7, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'twenty-eight-slashes-cellar-door-keys',
    name: 'Cellar door keys',
    category: 'keys',
    description:
      'Dark tines with nearly no bell and a slow panning throb, worn by a cassette and put through a slack, late dark spring.',
    preview: C_FLOORS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 2.6, tone: 0.3, bark: 0.5, tremolo: 0.45, tremoloRate: 0.7, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.45, hiss: 0.05 } },
      { deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.35, tension: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-landing-between-floors',
    name: 'Landing between floors',
    category: 'keys',
    description:
      'Tines panned slowly from side to side with a copy detuned late on each side, in a cathedral hall.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremoloRate: 0.3, decay: 2.4, bell: 0.35 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-barked-suspension',
    name: 'Barked suspension',
    category: 'keys',
    description:
      'Barking tines held level by a slow compressor, then played by a combo amplifier across a room.',
    preview: STEPPING_DOWN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bark: 0.95, hardness: 0.85, decay: 1.4, release: 0.4, drive: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { distance: 0.5, room: 0.6 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-under-the-tide-line',
    name: 'Under the tide line',
    category: 'keys',
    description:
      'Blunt endless tines with half their bell put back, sunk under wavering water and scattered into a dark field of echoes.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { bell: 0.5, tone: 0.35, tremolo: 0 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Just under',
        params: { depth: 0.35, bubbles: 0.1, waver: 0.6 },
      },
      { deviceId: 'constellation', preset: 'Dark field', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-tines-drawn-upward',
    name: 'Tines drawn upward',
    category: 'pad',
    description:
      'Long tines whose strike is taken off by a slow swell, so a triad fades in over its floor and hangs in a wide hall.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { decay: 4, release: 2.5, bell: 0.4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 700 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, mix: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-reed-over-foreign-bass',
    name: 'Reed over foreign bass',
    category: 'keys',
    description:
      'A fluttering reed of a tine, all bark and no bell, heard inside a shell and combed by a slow hollow chorus.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { decay: 1.6, tone: 0.5, tremolo: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.6, air: 0.4 } },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-four-short-stairs',
    name: 'Four short stairs',
    category: 'keys',
    description:
      'Short damped tines with chorused echoes stepping behind each chord, held under a safety limiter.',
    preview: STEPPING_DOWN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { decay: 0.4, release: 0.12, bark: 0.45 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 390, feedback: 0.5, mix: 0.4 },
      },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'twenty-eight-slashes-octave-storey',
    name: 'Octave storey',
    category: 'keys',
    description:
      'Clear bell tines with an octave stop added above them a moment late, over a small bright chamber.',
    preview: BELL_TOPS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { decay: 1.8, release: 0.6, tremolo: 0 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above', params: { sub: 0, mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-throb-under-dorian',
    name: 'Throb under Dorian',
    category: 'keys',
    description:
      'A dark tine with a full, slow tremolo in the middle of the field, its tail humming on a closed vowel.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremoloRate: 1.1, bell: 0.25, release: 1.2 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Humming', params: { mix: 0.36, decay: 5 } }],
  },
  {
    id: 'twenty-eight-slashes-warm-slab-of-tines',
    name: 'Warm slab of tines',
    category: 'keys',
    description:
      'Overdriven tines with their treble low, blurred by a room and a soft fuzz into three seconds of woolly glow.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { volume: -12, drive: 0.6, tone: 0.3, decay: 2 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.4, decay: 3 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'twenty-eight-slashes-triad-fanned-open',
    name: 'Triad fanned open',
    category: 'keys',
    description:
      'Quick shimmering tines whose partials come back one after another, low first, as each chord fans out.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { decay: 1.5, release: 0.8, tremolo: 0.35, tremoloRate: 6 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 900, mix: 0.45 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'twenty-eight-slashes-split-at-the-thumb',
    name: 'Split at the thumb',
    category: 'keys',
    description:
      'A felted piano kept almost dry, its lows thinned a little and its long tails lifted so a held triad stays in hearing.',
    preview: STEPPING_DOWN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0.05, action: 0.2, resonance: 0.2, outputDb: -16 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.45, threshold: -28 } },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { low: -2 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-lydian-upright',
    name: 'Lydian upright',
    category: 'keys',
    description:
      'An old detuned upright with creaking action, played back from a warped, worn record, with a hint of spring after it.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -14, hardness: 0.4, action: 0.5, grit: 0.2 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Ballroom 78',
        params: { crackle: 0.15, pops: 0.02, surface: 0.12 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'twenty-eight-slashes-pedal-held-on-b',
    name: 'Pedal held on B',
    category: 'keys',
    description:
      'Both pedals down on a blurred piano that keeps every floor sounding, smeared into a hanging mist.',
    preview: C_FLOORS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -15.5, felt: 0.8, reverbMix: 0.3, detune: 0.4 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { blur: 0.55, mix: 0.45 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-glass-above-the-fourth',
    name: 'Glass above the fourth',
    category: 'keys',
    description: 'A hard stiff piano with no felt, each note shadowed an octave up by slow sines.',
    preview: A_MINOR_FLOORS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -10, hardness: 0.7, reverbMix: 0.1 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.45, release: 4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-second-piano-downstairs',
    name: 'Second piano downstairs',
    category: 'keys',
    description:
      'A soft thud of a piano heard from the next room, quieter and darker, its body made a shade larger.',
    preview: BELL_TOPS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -12, hardness: 0.2, felt: 0.8 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.5 } },
      { deviceId: 'size', preset: 'A shade larger' },
    ],
  },
  {
    id: 'twenty-eight-slashes-folded-corner-pluck',
    name: 'Folded corner pluck',
    category: 'plucked',
    description:
      'A wooden pluck folded hard, its gate closing over two seconds, with repeats from two tape heads.',
    preview: STEPPING_DOWN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { volume: -4.5, fold: 0.5, decay: 2.2, chance: 0.05 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.3, feedback: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-mallet-on-lent-ground',
    name: 'Mallet on lent ground',
    category: 'plucked',
    description:
      'Round soft mallets, hardly folded, that set a table of bowls tuned in fifths on C ringing after them.',
    preview: BELL_TOPS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: -4, decay: 2.4, colour: 0.5 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 0, mix: 0.35, ring: 8, beat: 0.2 },
      },
    ],
  },
  {
    id: 'twenty-eight-slashes-gong-for-the-dark-ones',
    name: 'Gong for the dark ones',
    category: 'bell',
    description:
      'A long inharmonic gong tone, hardly folded and eight seconds in dying, a slow phase sweep turning inside it, in a dark hall.',
    preview: B_DIMINISHED_FLOORS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { volume: -4, fm: 0.4, fold: 0.15 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-floor-that-folds',
    name: 'Floor that folds',
    category: 'drone',
    description:
      'A folding drone with a slow swell and an octave below in its modulation, drifting in bands like water.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { attack: 0.7, fold: 0.5, drift: 0.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { highCut: 5000 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-bright-rungs',
    name: 'Bright rungs',
    category: 'plucked',
    description: 'A bright folded harp, every note thrown out again along a ladder of echoes.',
    preview: A_MINOR_FLOORS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { volume: -4.5, fold: 0.4, decay: 2.4 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Bent ladder', params: { mix: 0.35, fade: 0.6 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  {
    id: 'twenty-eight-slashes-sine-in-the-stairwell',
    name: 'Sine in the stairwell',
    category: 'pad',
    description: 'Pure swelling sines, unfolded, each chord climbing an octave in its own tail.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { volume: -9.5, attack: 0.6, decay: 6 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { mix: 0.4, shimmer: 0.35, decay: 6 },
      },
    ],
  },
  {
    id: 'twenty-eight-slashes-slash-cut-from-reed',
    name: 'Slash cut from reed',
    category: 'wind',
    description:
      'Lopsided folded reed tones, narrowed by a stopped pipe and swung by a soft harmonic tremolo.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { volume: -7, attack: 0.2, fold: 0.4, drift: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { body: 2, mix: 0.5 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3, depth: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-rain-on-the-sixth',
    name: 'Rain on the sixth',
    category: 'plucked',
    description:
      'Short wooden drips, each a little different in tone, pressed by a limiter, then caught and held as a thin even pad.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { decay: 0.7, fm: 0.1, chance: 0.4, attack: 0.025, volume: -0.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 20, outputGain: -5 } },
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.6, attack: 0.6 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-six-voices-upstairs',
    name: 'Six voices upstairs',
    category: 'pad',
    description:
      'Ensemble strings with the octave below taken out, so the triad floats and leaves the floor to another part.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { volume: -3.5, low: 0, high: 0.5, attack: 0.4, release: 2.4 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-fog-over-the-pedal',
    name: 'Fog over the pedal',
    category: 'pad',
    description:
      'Low, very dark strings with a slow ensemble, blurred until no change of chord has an edge.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 1.1, release: 3.5, tone: 600 },
    },
    effects: [{ deviceId: 'fog', preset: 'Deep fog', params: { mix: 0.8 } }],
  },
  {
    id: 'twenty-eight-slashes-glass-on-the-ninth',
    name: 'Glass on the ninth',
    category: 'pad',
    description:
      'Bright thin strings with the upper octave full and the lower gone, its bands glinting one by one into an endless plate.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.7, release: 3, tone: 9000 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-cello-floorboards',
    name: 'Cello floorboards',
    category: 'bass',
    description:
      'Strings with the octave below full and no top, quick to speak, fattened by iron and a deep low shelf, for the bass under a triad.',
    preview: STEPPING_UP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.07, release: 0.5, tone: 900, ensemble: 0.4 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'twenty-eight-slashes-dry-saw-planks',
    name: 'Dry saw planks',
    category: 'keys',
    description:
      'Plain saws with no ensemble and a quick start, a low filter opened by every chord, slapped once by tape.',
    preview: STEPPING_DOWN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { release: 0.6, tone: 4200 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-three-octave-awning',
    name: 'Three octave awning',
    category: 'pad',
    description:
      'All three octaves wide open under a bright ensemble, turned slowly by a deep eight-stage phaser.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { volume: -7.5, attack: 0.3, release: 1.8, tone: 4000 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { mix: 0.5, rate: 0.12 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'twenty-eight-slashes-plain-organ-in-a-lobby',
    name: 'Plain organ in a lobby',
    category: 'organ',
    description:
      'Straight saws with no motion, coloured by a fixed formant, their slow repeats drifting in pitch from side to side.',
    preview: BELL_TOPS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -9.5, release: 0.25, low: 0.4, high: 0.15, tone: 1400 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Still formant', params: { mix: 0.6 } },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-dissolving-mezzanine',
    name: 'Dissolving mezzanine',
    category: 'pad',
    description:
      'Slow strings whose tails sag and darken as they ring, so the old triad sinks into the new floor.',
    preview: C_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { volume: -5, attack: 1, release: 2.5, tone: 2400 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } }],
  },
  {
    id: 'twenty-eight-slashes-muted-violins-on-f',
    name: 'Muted violins on F',
    category: 'pad',
    description:
      'Muted upper violins under a slow breathing that opens and shuts their level and their colour.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.6, tone: 1700 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.55 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-viola-landing',
    name: 'Viola landing',
    category: 'pad',
    description:
      'One octave of violas, narrow and close, loosely doubled and left in a narrow warm spring.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { volume: -0.5, attack: 0.18, release: 1.4, tone: 2300 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.45 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-out-of-true',
    name: 'Out of true',
    category: 'pad',
    description: 'Strings drifting hard with a fast ensemble, printed on a seasick tape.',
    preview: B_DIMINISHED_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.5, tone: 1500, drift: 0.7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.05 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'twenty-eight-slashes-hollow-banister',
    name: 'Hollow banister',
    category: 'pad',
    description:
      'Hollow strings with no low octave, combed by a negative flanger and answered faintly backwards.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { volume: -3, attack: 0.3, low: 0 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { mix: 0.45 } },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-shimmer-left-standing',
    name: 'Shimmer left standing',
    category: 'pad',
    description:
      'Bright strings that hold on to whatever tone two chords share and let go of the rest.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -6, attack: 0.5, release: 2.2, tone: 7000, speed: 1.2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.75 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-floor-with-no-name',
    name: 'Floor with no name',
    category: 'bass',
    description:
      'A plain sine whose level rises and falls like sea, a little of it folded into glassy overtones.',
    preview: STEPPING_UP,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pure sine',
      params: { volume: -14.5, attack: 0.15, release: 1.6, shape: 0.1 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.4 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.45, depth: 0.6 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-cellar-lamp',
    name: 'Cellar lamp',
    category: 'bass',
    description:
      'A sub whose added harmonics set strings tuned to G major ringing above it, a lit triad over a dark floor.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pedal tone',
      params: { volume: -18, attack: 0.03, release: 0.5, harmonics: 0.8 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Open triad',
        params: { root: 7, mode: 0, mix: 0.55, decay: 5 },
      },
    ],
  },
  {
    id: 'twenty-eight-slashes-b-that-falls-a-tone',
    name: 'B that falls a tone',
    category: 'bass',
    description:
      'A sub that slides from one floor to the next, its added harmonics turned over by a slow phaser and pulled wide.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Gliding sub',
      params: { volume: -16.5, glide: 0.4, harmonics: 1, shape: 0.6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Glacial sweep',
        params: { mix: 0.5, rate: 0.15, centerHz: 300 },
      },
      { deviceId: 'spread', preset: 'Wide bass' },
    ],
  },
  {
    id: 'twenty-eight-slashes-foundation-boom',
    name: 'Foundation boom',
    category: 'bass',
    description:
      'A long boom that drops two octaves onto the note, with its attack pressed flat and a dark cave after.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Long boom',
      params: { drop: 24, fall: 120, decay: 4, release: 1.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 10, outputGain: -8 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.22, decay: 3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-boiler-room-hum',
    name: 'Boiler room hum',
    category: 'drone',
    description:
      'A square-ish hum for small speakers, boxed inside a wooden body and swung slowly in level.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Small speaker hum',
      params: { volume: -17.5, attack: 0.2, harmonics: 0.6, drive: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.6 } },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.5, depth: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-swell-from-the-footing',
    name: 'Swell from the footing',
    category: 'bass',
    description:
      'A sub that swells in over half a second and sets off a rumbling wall of fuzz and room, turned slowly by a dark drum.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Slow swell',
      params: { volume: -22.5, attack: 0.5, release: 1.6, harmonics: 0.7 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Low rumble', params: { mix: 0.4, decay: 6 } },
      { deviceId: 'rotary', preset: 'Dark drum', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-short-post-in-the-mud',
    name: 'Short post in the mud',
    category: 'bass',
    description: 'A short thump with a falling start, its few dark echoes murky behind it.',
    preview: STEPPING_UP,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Short thump',
      params: { volume: -10, decay: 0.9, harmonics: 0.5, drop: 9 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 520, feedback: 0.35, mix: 0.35 },
      },
    ],
  },
  {
    id: 'twenty-eight-slashes-driven-girder',
    name: 'Driven girder',
    category: 'bass',
    description:
      'A driven pulse with some square in it, held under a steep low filter and then a console.',
    preview: STEPPING_UP,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Driven pulse',
      params: { volume: -12, decay: 2, drive: 0.6, shape: 0.45 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 500 } },
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-square-column',
    name: 'Square column',
    category: 'bass',
    description:
      'A hollow square, level from start to end, with an octave above it and a slow narrow phase sweep.',
    preview: STEPPING_UP,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Hollow square',
      params: { volume: -20, attack: 0.04, release: 0.35, drive: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.4, sub1: 0 } },
      { deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-sighing-joist',
    name: 'Sighing joist',
    category: 'bass',
    description:
      'Each floor sighs down an octave onto its note, its deepest lows thinned, pulsing softly toward two sides.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Falling sigh',
      params: { attack: 0.15, fall: 350, harmonics: 0.5, decay: 8 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Soft throb', params: { rate: 3, apart: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'twenty-eight-slashes-dub-under-am',
    name: 'Dub under Am',
    category: 'bass',
    description:
      'A heavy rounded sub with a small drop, sent into a dub spring and then thickened by cassette warmth.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dub weight',
      params: { volume: -18, decay: 5, drive: 0.5, harmonics: 0.3 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { mix: 0.2, tone: 1800 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-well-under-the-house',
    name: 'Well under the house',
    category: 'drone',
    description:
      'A slow dark sub with pipes a fifth above and an octave below speaking late, as if from the bottom of a well.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dark drone',
      params: { volume: -17.5, attack: 0.4, release: 2, glide: 0.15, harmonics: 0.3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { speak: 500, mix: 0.6 } },
      { deviceId: 'vessel', preset: 'Deep well', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-horns-a-step-too-high',
    name: 'Horns a step too high',
    category: 'wind',
    description:
      'A section of horns swelling over half a second, with a vast nave behind the chord.',
    preview: G_FLOORS,
    instrument: { deviceId: 'horns', preset: 'Horn swell', params: { attack: 0.5, release: 2 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } }],
  },
  {
    id: 'twenty-eight-slashes-flugel-on-a-wrong-bass',
    name: 'Flugel on a wrong bass',
    category: 'wind',
    description:
      'Breathy flugelhorns whose held notes slowly part into a chorus, each chord unfolding again from low to high.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { vibrato: 0, section: 0.7, breath: 0.7, attack: 0.3, release: 2 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Opens to chorus' },
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-low-brass-foundation',
    name: 'Low brass foundation',
    category: 'wind',
    description:
      'A full section of low brass rising over most of a second, with an octave below it and a warm triode.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { volume: -1.5, attack: 0.8, release: 2, blow: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35, up1: 0 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.2 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-muted-and-underlined',
    name: 'Muted and underlined',
    category: 'wind',
    description:
      'A few muted trumpets through a station horn at the far end of a hard platform, doubled wide.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: -9, section: 0.6, attack: 0.25, release: 1.6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { noise: 0 } },
      { deviceId: 'stereo-detune', preset: 'Doubled' },
    ],
  },
  {
    id: 'twenty-eight-slashes-band-on-the-stairs',
    name: 'Band on the stairs',
    category: 'wind',
    description:
      'A brass band section, bright with effort, heard from half way up a stone stairwell.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.2, blow: 0.5, release: 1.4 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.45 } }],
  },
  {
    id: 'twenty-eight-slashes-horns-wide-of-d-minor',
    name: 'Horns wide of D minor',
    category: 'wind',
    description:
      'A small horn section with a soft start, spread by a lush slow chorus and pressed level.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { harmony: 0, attack: 0.35, release: 1.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
  },
  {
    id: 'twenty-eight-slashes-cushion-of-mutes',
    name: 'Cushion of mutes',
    category: 'wind',
    description: 'A muted section faded in, lit from behind by a vowel of oo and shut in its top.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: 3, attack: 0.6, release: 2, blow: 0.22 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'twenty-eight-slashes-tuba-on-the-second-step',
    name: 'Tuba on the second step',
    category: 'bass',
    description:
      'One soft breathy tuba that speaks quickly, resonant in a clay body and half hidden in a short dark cloud.',
    preview: STEPPING_UP,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.18, release: 0.9, breath: 0.45, blow: 0.3, volume: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-air-where-the-third-was',
    name: 'Air where the third was',
    category: 'wind',
    description:
      'Almost all breath: a horn of air whose tones are lifted out of the noise, held a little and left in an open space.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.4, release: 1.8, blow: 0.15 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only', params: { air: -18, hold: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 5, mix: 0.35 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-slow-glacier-of-f',
    name: 'Slow glacier of F',
    category: 'wind',
    description:
      'Heavy horns blown firmly over a long attack, rolled through breaking bands of level.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 1.2, release: 3, blow: 0.65 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Breaking waves', params: { depth: 0.5 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'twenty-eight-slashes-trumpet-above-the-b',
    name: 'Trumpet above the B',
    category: 'wind',
    description:
      'A single trumpet on each note with a wide vibrato, answered by worn tape and a short spring.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { vibrato: 0.5, blow: 0.32 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 450, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-trombone-landing',
    name: 'Trombone landing',
    category: 'wind',
    description:
      'A single trombone on each note with a firm edge, spun by a fast rotor far away and cut at both ends.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { attack: 0.08, blow: 0.6, release: 0.8 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Far shimmer', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'twenty-eight-slashes-thumb-under-the-triad',
    name: 'Thumb under the triad',
    category: 'bass',
    description:
      'An electric bass plucked with the thumb at the neck, evened by a quick compressor, pure sines an octave up lingering behind it.',
    preview: BROKEN_STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { volume: -3.5, sustain: 10, release: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { mix: 0.45, attack: 250, release: 1.5, partials: 4 },
      },
    ],
  },
  {
    id: 'twenty-eight-slashes-fretless-leaning-on-f',
    name: 'Fretless leaning on F',
    category: 'bass',
    description:
      'A singing fretless with its growl up, each note swaying more the longer it lasts, in a warm narrow spring.',
    preview: BROKEN_C,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { growl: 0.9, sustain: 10 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-upright-at-the-turn',
    name: 'Upright at the turn',
    category: 'bass',
    description:
      'A plucked upright with a long wooden ring, its body made larger and set in a tight room.',
    preview: BROKEN_STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: 1, sustain: 8, touch: 0.2 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-sevenths-picked-clean',
    name: 'Sevenths picked clean',
    category: 'bass',
    description:
      'A bright pick near the bridge, chorused above and spread wide at the top with the lows held firm.',
    preview: BROKEN_C,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { volume: 2.5, position: 0.1, touch: 0.7 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy' },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-muted-tread',
    name: 'Muted tread',
    category: 'bass',
    description:
      'Palm-muted thuds for floor and triad alike, with a soft tape echo a short stair behind.',
    preview: BROKEN_STEPS,
    instrument: { deviceId: 'string-bass', preset: 'Muted thud', params: { mute: 0.5, tone: 0.4 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 260, mix: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'twenty-eight-slashes-flat-strings-in-c',
    name: 'Flat strings in C',
    category: 'bass',
    description:
      'Dark flat strings with no growl, driven through a woolly stack turned off its axis, with iron warmth after.',
    preview: BROKEN_C,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { volume: -9, sustain: 4, tone: 0.35 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { drive: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'twenty-eight-slashes-floor-left-ringing',
    name: 'Floor left ringing',
    category: 'drone',
    description:
      'Electric bass strings left undamped for many seconds, caught and held as an even bed in a warm hall.',
    preview: BROKEN_C,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { growl: 0.3, resonance: 0.5, release: 1.6 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.5 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { mix: 0.25, lowDecay: 3.5, crossover: 300 },
      },
    ],
  },
  {
    id: 'twenty-eight-slashes-rattle-on-the-threshold',
    name: 'Rattle on the threshold',
    category: 'bass',
    description:
      'A hard pick with a rattle against the frets, ring modulated faintly on C and muffled.',
    preview: BROKEN_STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { growl: 0.7, tone: 0.6 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'twenty-eight-slashes-bridge-tone-close',
    name: 'Bridge tone, close',
    category: 'bass',
    description:
      'Strings plucked by the bridge, thin and nasal, with a slow notch moving across them.',
    preview: BROKEN_C,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { volume: 3, resonance: 0.5, sustain: 5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { mix: 0.8 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'twenty-eight-slashes-quiet-deep-landing',
    name: 'Quiet deep landing',
    category: 'bass',
    description:
      'A quiet fretless with the attack swelled away, so each floor is leaned into like a bowed note, in a small room.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: 1, growl: 0.6, tone: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 350 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-slap-below-the-triad',
    name: 'Slap below the triad',
    category: 'bass',
    description:
      'A slapped upright, all wood and edge, with strings tuned to G major ringing on above each note.',
    preview: BROKEN_STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { volume: 6, growl: 0.6, sustain: 4 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring', params: { root: 7, mode: 0, mix: 0.4 } },
      { deviceId: 'tamer', preset: 'Ringing tones' },
    ],
  },
  {
    id: 'twenty-eight-slashes-soft-upright-far-wall',
    name: 'Soft upright, far wall',
    category: 'bass',
    description:
      'A dark soft upright whose echo skips gently away, the whole of it heard across a room.',
    preview: B_FALLS_TO_A,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { volume: 4.5, tone: 0.25, mute: 0.05 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.35 } },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'twenty-eight-slashes-seven-over-a-wrong-floor',
    name: 'Seven over a wrong floor',
    category: 'voice',
    description:
      'A full section on a dulled ah with no vibrato, slowly combed by a twelve-stage cloud and set in a hall.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { volume: -5, attack: 0.5, ensemble: 1, vibrato: 0, tone: 3200, vowel: 0.14 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-monks-on-the-low-e',
    name: 'Monks on the low E',
    category: 'voice',
    description:
      'Low monks on oh without vibrato, a whistled overtone stepping through B, D and E above them.',
    preview: B_DIMINISHED_FLOORS,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { volume: -5, attack: 0.6, release: 2 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Thin drone',
        params: { root: 4, low: 6, high: 8, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-boys-above-the-ninth',
    name: 'Boys above the ninth',
    category: 'voice',
    description:
      'High boys on oo, with no vibrato, and an octave above them glimmering in a narrow tail.',
    preview: E_MINOR_FLOORS,
    instrument: { deviceId: 'choir', preset: 'Boys ooh', params: { attack: 0.35, vibrato: 0 } },
    effects: [
      { deviceId: 'shimmer', preset: 'Narrow fifth', params: { interval: 0, mix: 0.35, decay: 5 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-breath-on-the-sixth',
    name: 'Breath on the sixth',
    category: 'voice',
    description:
      'Breath more than voice, in bands that open and shut like a tide, leaned gently toward the notes of C major.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 1, release: 3, breath: 0.85 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      {
        deviceId: 'scale-filter',
        preset: 'Wide and gentle',
        params: { root: 0, scale: 0, mix: 0.6 },
      },
    ],
  },
  {
    id: 'twenty-eight-slashes-vowels-in-disagreement',
    name: 'Vowels in disagreement',
    category: 'voice',
    description:
      'Slow vowels turning on their own, dulled, inside a wheeling flock of copies, hollowed in the middle.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 0.7, release: 2.5, tone: 2200, vowel: 0.6, breath: 0.1 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Wheeling', params: { mix: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'twenty-eight-slashes-glassy-ee-on-top',
    name: 'Glassy ee on top',
    category: 'voice',
    description:
      'Hard bright ee with no vibrato, smeared into a bright glass halo that hangs after each chord.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.6, release: 2, tone: 8000 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.5 } }],
  },
  {
    id: 'twenty-eight-slashes-hummed-ground',
    name: 'Hummed ground',
    category: 'voice',
    description:
      'A closed hum with the top shut off, a little worn and wavering on an old reel, and opened wide in the middle.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.4, tone: 1000, motion: 0.3 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.1, wobble: 0.45 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'twenty-eight-slashes-altos-split-three-ways',
    name: 'Altos split three ways',
    category: 'voice',
    description: 'Altos on eh with a quick start, each chord followed by a reverse swell of room.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -5.5, attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.4, time: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'twenty-eight-slashes-basses-ah-two-floors',
    name: 'Basses ah, two floors',
    category: 'voice',
    description:
      'Bass voices on ah, dark and quick to speak, with the octave below added quietly and no hall.',
    preview: D_MINOR_FLOORS,
    instrument: { deviceId: 'choir', preset: 'Basses ah', params: { attack: 0.15, release: 0.8 } },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.3, up1: 0 } },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'twenty-eight-slashes-short-ah-long-answer',
    name: 'Short ah, long answer',
    category: 'voice',
    description:
      'Sung ahs that start and stop almost at once and leave a blooming octave tail to carry the chord.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { volume: -4.5, attack: 0.03, release: 0.3, breath: 0.3 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.45, decay: 5 } }],
  },
  {
    id: 'twenty-eight-slashes-minor-ninth-bowed-low',
    name: 'Minor ninth, bowed low',
    category: 'string',
    description:
      'A dark cello drone with a heavy slow bow and a full wooden body, a long dark spring coming late behind it.',
    preview: C_FLOORS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.5, vibrato: 0, pressure: 0.9, brightness: 0.2, body: 1, detune: 5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-glass-bow-on-the-fifth',
    name: 'Glass bow on the fifth',
    category: 'string',
    description: 'A light glassy bow close to the bridge, two strings beating, in an airy tail.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.8, release: 2.5, detune: 7 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } },
      { deviceId: 'glimmer', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'twenty-eight-slashes-octave-fed-back',
    name: 'Octave fed back',
    category: 'string',
    description:
      'A sustained string that blooms into its octave and howls a little on the note that stays longest.',
    preview: D_MINOR_FLOORS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.6, release: 2.5, pressure: 0.8 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Faint sustain', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'twenty-eight-slashes-gut-plucked-on-the-slash',
    name: 'Gut plucked on the slash',
    category: 'plucked',
    description:
      'Felted plucks from a slightly enlarged body, each one echoed at a dotted interval.',
    preview: BELL_TOPS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { decay: 4, brightness: 0.3 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
      { deviceId: 'size', preset: 'A shade larger' },
    ],
  },
  {
    id: 'twenty-eight-slashes-wire-above-held-wood',
    name: 'Wire above held wood',
    category: 'plucked',
    description:
      'Bright wires plucked and left to ring, with ten high bowls sounding in the key of C behind.',
    preview: A_MINOR_FLOORS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { release: 5, brightness: 0.65 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Ten bright bowls', params: { root: 0, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'twenty-eight-slashes-damped-post',
    name: 'Damped post',
    category: 'plucked',
    description:
      'Damped woody plucks with no ring of their own, an octave below added, skipping off in even dull steps through old tape air.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.2, decay: 1.8, volume: -9 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Even steps', params: { mix: 0.35 } },
      { deviceId: 'octaves', preset: 'Faint octave', params: { sub1: 0.3, up1: 0 } },
      { deviceId: 'tape', preset: 'Hiss and air', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-beating-under-lydian',
    name: 'Beating under Lydian',
    category: 'plucked',
    description:
      'Strings twenty-five cents apart, plucked and left to beat, with a very slow frequency drift under them.',
    preview: G_FLOORS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { release: 6, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-still-floor-bare-feet',
    name: 'Still floor, bare feet',
    category: 'drone',
    description:
      'The plainest held tone a string makes, no body and no bow noise, seen through warm shallow water.',
    preview: E_MINOR_FLOORS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.8, release: 3, brightness: 0.15 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'twenty-eight-slashes-rasp-against-the-triad',
    name: 'Rasp against the triad',
    category: 'string',
    description: 'A raspy bow pressed hard, left in a cistern and muffled.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.3, pressure: 0.75, brightness: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'twenty-eight-slashes-flautando-ceiling',
    name: 'Flautando ceiling',
    category: 'string',
    description:
      'A light bow far from the bridge with no pressure, a faint string pad growing behind it.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.45 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'twenty-eight-slashes-flock-over-four-floors',
    name: 'Flock over four floors',
    category: 'pad',
    description:
      'An evening flock of small voices that fly up to each note of the triad and hover there.',
    preview: E_MINOR_FLOORS,
    instrument: { deviceId: 'flock', preset: 'Evening flock', params: { gather: 0.6, tone: 0.35 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'twenty-eight-slashes-reeds-settling-on-d',
    name: 'Reeds settling on D',
    category: 'pad',
    description:
      'Reedy voices that gather from above and below, turned by a warm six-stage phaser and given a sheen by a console.',
    preview: D_MINOR_FLOORS,
    instrument: { deviceId: 'flock', preset: 'Reed choir', params: { gather: 0.35, tone: 0.75 } },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Sheen' },
    ],
  },
  {
    id: 'twenty-eight-slashes-falling-in-from-the-roof',
    name: 'Falling in from the roof',
    category: 'pad',
    description:
      'Voices that fall onto each note from above, their tail barely sagging as it fades into a faint hall.',
    preview: F_FLOORS,
    instrument: {
      deviceId: 'flock',
      preset: 'Falling in',
      params: { gather: 0.9, birds: 5, tone: 0.3 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Barely there', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-hollow-pair-one-wall',
    name: 'Hollow pair, one wall',
    category: 'pad',
    description:
      'Two hollow voices wide apart, pulsed left then right by soft gates, a long hall arriving late behind them.',
    preview: CONTRARY,
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { gather: 0.25, tone: 0.7, leave: 1.2 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Left then right' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twenty-eight-slashes-swarm-in-the-rafters',
    name: 'Swarm in the rafters',
    category: 'pad',
    description:
      'A glass swarm flickering round every note, its octaves scattered into a glinting cavern of echoes.',
    preview: A_MINOR_FLOORS,
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { gather: 0.5, flutter: 1.2, leave: 2, tone: 0.25, birds: 6 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Glinting', params: { mix: 0.5, feedback: 0.7 } },
      { deviceId: 'tamer', preset: 'Bright tail' },
    ],
  },
]
