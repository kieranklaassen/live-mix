import { type FactoryPreset } from '../types'

// Each preset is drawn from a row of the family's sources and says what is
// heard: the colour, the cut, how long a swell lasts, the room. The first half
// are the noises the research plays (steady white, pink and brown, a swell
// every three to five seconds, and the quickest swell this bed makes, one to
// three seconds, where the research asks for one a second); the second half
// are places where noise is already music (a room and a little noise, held
// keys a fifth or an octave apart, wind, surf and air).
//
// Volume is set on every one: at the device's own -12 dB a held key reads
// under the bank's floor. Width stays at 0.8 or under, so a mono fold keeps
// its level, and brown noise with Tint near 1 is never above -8 dB.

export const COLOURED_NOISE_PRESETS: readonly FactoryPreset[] = [
  // --- The noises the research plays: steady colours ---
  {
    id: 'steady-white-noise',
    name: 'Steady white',
    category: 'texture',
    description:
      'Flat white noise that stands still, every pitch as loud as the next, with a trace of a small booth.',
    instrument: { deviceId: 'coloured-noise', preset: 'White', params: { width: 0.8, volume: -8 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } }],
  },
  {
    id: 'steady-pink-noise',
    name: 'Steady pink',
    category: 'texture',
    description:
      'Pink noise that stands still, each octave as loud as the next, with a tight room close around it.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pink', params: { volume: -7 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
  },
  {
    id: 'steady-brown-noise',
    name: 'Steady brown',
    category: 'texture',
    description:
      'Brown noise that stands still, a deep even rumble that thins out toward the top, in a small room.',
    instrument: { deviceId: 'coloured-noise', preset: 'Brown', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } }],
  },
  {
    id: 'brown-under-700',
    name: 'Brown, low only',
    category: 'texture',
    description:
      'Brown noise with all above 700 hertz taken off: a soft low rumble with no hiss in it, on warm tape.',
    instrument: { deviceId: 'coloured-noise', preset: 'Brown, low only', params: { volume: -8 } },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  {
    id: 'pink-top-off',
    name: 'Pink, top off',
    category: 'texture',
    description:
      'Pink noise with all above 3.5 kilohertz taken off and a faint slow drift, in a tight chamber.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pink, top off', params: { volume: -7 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'white-high-only',
    name: 'White, high only',
    category: 'texture',
    description:
      'White noise with all below 2 kilohertz taken off: a thin bright hiss, with a faint sheen of plate.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'White, high only',
      params: { width: 0.8, volume: -7 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen' }],
  },
  {
    id: 'pink-mid-band',
    name: 'Pink, mid band',
    category: 'texture',
    description:
      'Pink noise kept between 300 and 2500 hertz: a narrow band with neither rumble nor hiss, close up.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pink, mid band', params: { volume: -6 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { body: 3, presence: 3, clear: 0 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.1 } },
    ],
  },
  {
    id: 'pink-under-a-pitch',
    name: 'Pink under a pitch',
    category: 'texture',
    description:
      'Steady pink noise with a band at the held key standing fifteen decibels over it: a pitch in the hiss.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pink with pitch', params: { volume: -8 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } }],
  },
  {
    id: 'pale-pink-noise',
    name: 'Pale pink',
    category: 'texture',
    description:
      'Noise half way from white to pink, a bright even hiss that barely drifts, with a thin veil of room.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pale pink', params: { volume: -8 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Thin veil' }],
  },
  // --- A swell every three to five seconds ---
  {
    id: 'pink-four-second-swells',
    name: 'Pink, 4 s swells',
    category: 'texture',
    description:
      'Pink noise that sinks and comes back about every four seconds, no two swells one length, in a hall.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pink, 4 s swells',
      params: { width: 0.8, volume: -8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'brown-five-second-swells',
    name: 'Brown, 5 s swells',
    category: 'texture',
    description:
      'Deep brown noise that sinks and darkens about every five seconds and comes back, in a long plate.',
    instrument: { deviceId: 'coloured-noise', preset: 'Brown, 5 s swells', params: { volume: -7 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } }],
  },
  {
    id: 'white-three-second-swells',
    name: 'White, 3 s swells',
    category: 'texture',
    description:
      'Bright noise with the lows cut that sinks and dulls about every three seconds, in a small room.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'White, 3 s swells',
      params: { width: 0.8, volume: -8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'low-rumble-swells',
    name: 'Low, 3.5 s swells',
    category: 'texture',
    description:
      'A rumble under 900 hertz that sinks by up to nine decibels and returns about every three and a half seconds.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Brown, low only',
      params: { highCut: 900, drift: 1, driftTime: 3.5, width: 0.5, attack: 0.5, volume: -8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } }],
  },
  // --- The quickest swell this bed makes: one to three seconds ---
  {
    id: 'brown-two-second-swells',
    name: 'Brown, 2 s swells',
    category: 'texture',
    description:
      'Brown noise sinking and returning every one to three seconds, the quickest swell this bed makes.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Brown, 2 s swells',
      params: { volume: -6.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } }],
  },
  {
    id: 'pink-two-second-swells',
    name: 'Pink, 2 s swells',
    category: 'texture',
    description:
      'Pink noise with the top off, sinking part way and returning every one to three seconds, in a room.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pink, top off',
      params: { highCut: 5000, drift: 0.7, driftTime: 2, width: 0.7, attack: 0.5, volume: -6.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  // --- Where noise is already music: a room and a little noise ---
  {
    id: 'pink-in-a-nave',
    name: 'Pink in a nave',
    category: 'texture',
    description:
      'Pink noise easing in over four seconds in a vast nave: a bed to lay under bare tones, held by the room.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pink, slow rise',
      params: { attack: 4, volume: -7 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } }],
  },
  {
    id: 'dark-pink-hall',
    name: 'Dark pink hall',
    category: 'texture',
    description:
      'Noise between pink and brown, barely drifting, in a dark hall whose tail takes the last of the top.',
    instrument: { deviceId: 'coloured-noise', preset: 'Dark pink', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
  },
  {
    id: 'hiss-in-a-plate',
    name: 'Hiss in a plate',
    category: 'texture',
    description:
      'A thin hiss above a kilohertz rising over two and a half seconds into a long bright plate: air over held tones.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Hiss, slow rise',
      params: { attack: 2.5, volume: -6 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.85, mix: 0.4 } },
    ],
  },
  {
    id: 'brown-in-a-cave',
    name: 'Brown in a cave',
    category: 'texture',
    description:
      'Brown noise rising over four seconds in a dark cave, its rumble blurred by a tail of six seconds.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Brown, slow rise',
      params: { attack: 4, volume: -7 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave' }],
  },
  // --- Keys that tint the bed: a fifth or an octave apart, which do not beat, then chords and a line ---
  {
    id: 'tinted-low-fifth',
    name: 'Tinted low fifth',
    category: 'drone',
    description:
      'Brown noise ringing at each held key: a low fifth or an octave stands in the rumble as a soft chord.',
    instrument: { deviceId: 'coloured-noise', preset: 'Brown with pitch', params: { volume: -10 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'pitched-pink-chord',
    name: 'Pink chord',
    category: 'pad',
    description:
      'Dark pink noise with the top off and a soft band at every key of a chord, rising over three seconds.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pitch, top off', params: { volume: -8 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'whistling-white',
    name: 'Whistling white',
    category: 'wind',
    description:
      'Bright noise with a whistle at the key, one voice for a slow line, as wind sings in a gap, in a room.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'White with pitch',
      params: { width: 0.8, attack: 0.3, release: 1.2, volume: -8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'pitch-in-the-swells',
    name: 'Pitch in swells',
    category: 'pad',
    description:
      'A chord of soft bands in dark pink noise that sinks and returns about every four seconds, in a hall.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pitch and swells', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } }],
  },
  // --- Weather, water and air ---
  {
    id: 'slow-surf',
    name: 'Slow surf',
    category: 'texture',
    description:
      'Pink noise in long swells of six to eighteen seconds that darken as they sink, in an open valley.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pink, long swells',
      params: { width: 0.8, volume: -7 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } }],
  },
  {
    id: 'wind-in-a-pipe',
    name: 'Wind in a pipe',
    category: 'texture',
    description:
      'Pale drifting noise blown through a pipe, so a hollow pitch comes and goes with each swell.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Pale pink',
      params: { drift: 0.8, driftTime: 5, volume: -8 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wind in the pipe' }],
  },
  {
    id: 'phased-pink',
    name: 'Phased pink',
    category: 'texture',
    description:
      'Steady pink noise through slow moving notches: a hollow sweep that climbs and falls over many seconds.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pink', params: { volume: -6.5 } },
    effects: [{ deviceId: 'phaser', preset: 'Glacial sweep' }],
  },
  {
    id: 'noise-in-fifths',
    name: 'Noise in fifths',
    category: 'texture',
    description:
      'Pink noise through resonators tuned in fifths: the bed hums a bare open chord under its own hiss.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pink, centred', params: { volume: -8 } },
    effects: [
      { deviceId: 'scale-filter', preset: 'Open fifths', params: { depth: 24, glow: 1 } },
      {
        deviceId: 'ambient-eq',
        preset: 'Open',
        params: { low: 4, body: 4, presence: 4, air: 4, clear: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'far-shore-noise',
    name: 'Far shore',
    category: 'texture',
    description:
      'Dark swells of about nine seconds heard from far off: dull and low, with the air of the distance.',
    instrument: {
      deviceId: 'coloured-noise',
      preset: 'Brown, slow rise',
      params: { colour: 0.8, drift: 0.9, attack: 2, release: 5, volume: -6.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
  },
  {
    id: 'quick-pink-bursts',
    name: 'Pink bursts',
    category: 'texture',
    description:
      'Short bursts of pale pink noise that start at once and stop inside half a second, in a small plate.',
    instrument: { deviceId: 'coloured-noise', preset: 'Pink, quick', params: { volume: -7 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
    preview: 'keys',
  },
  {
    id: 'brown-under-water',
    name: 'Brown under water',
    category: 'texture',
    description:
      'Brown noise heard from under water: the top gone, the low end slowly rolling, bubbles now and then.',
    instrument: { deviceId: 'coloured-noise', preset: 'Brown', params: { width: 0.6, volume: -8 } },
    effects: [{ deviceId: 'underwater', preset: 'Deep water' }],
  },
]
