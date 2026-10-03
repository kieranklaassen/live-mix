import { type FactoryPreset } from '../types'

// The built-in chorus is the sound of this instrument, so nothing here puts a
// chorus effect after it: only rooms, tape and echo.

export const DUSK_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'dusk-strings',
    name: 'Dusk strings',
    category: 'pad',
    description:
      'The eighties chorus pad as it comes: sawtooth and moving pulse over a sub octave, with a hall behind it.',
    instrument: { deviceId: 'dusk', preset: 'Soft strings' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'cassette-pulse-pad',
    name: 'Cassette pulse pad',
    category: 'pad',
    description:
      'A thin moving pulse under the deeper chorus, worn by a cassette and left in a very large room.',
    instrument: { deviceId: 'dusk', preset: 'Wide pulse', params: { volume: -13 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'evening-swell',
    name: 'Evening swell',
    category: 'pad',
    description:
      'A dark chord whose filter opens over three seconds and closes for longer, in a long plate.',
    instrument: { deviceId: 'dusk', preset: 'Slow bloom' },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'filter-song',
    name: 'Filter song',
    category: 'pad',
    description:
      'The filter singing two octaves above each key, almost a sine, repeated by tape heads in a cathedral.',
    instrument: { deviceId: 'dusk', preset: 'Singing filter' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
    preview: 'line',
  },
  {
    id: 'low-tide-pad',
    name: 'Low tide pad',
    category: 'pad',
    description:
      'Square and full sub octave with the filter nearly shut: a dark bed for low chords and drones.',
    instrument: { deviceId: 'dusk', preset: 'Sub floor', params: { volume: -13 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
    preview: 'low',
  },
  // From here on a chain may also flange, shift or wear the sound, and some switch
  // the built-in chorus off; still no chorus effect follows the instrument.
  {
    id: 'dusk-saw-room',
    name: 'Dusk saw room',
    category: 'pad',
    description:
      'A plain sawtooth with the filter open over a little sub octave, quick to speak and to stop, close up in a tight chamber.',
    instrument: {
      deviceId: 'dusk',
      params: { wave: 0, sub: 0.3, cutoff: 9000, envelope: 0, attack: 0.12, release: 1.2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'dusk-soft-brass',
    name: 'Dusk soft brass',
    category: 'pad',
    description:
      'Sawtooth chords whose filter opens with each key and settles back, the soft brass of a polysynth, in a small plate.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0,
        cutoff: 220,
        resonance: 0.2,
        envelope: 0.68,
        attack: 0.1,
        release: 0.8,
        volume: -5.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'hollow-square-reed',
    name: 'Hollow square reed',
    category: 'wind',
    description:
      'One hollow square wave with the chorus off and no sub octave: a mono reed voice for a single line, in a room.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 1,
        sub: 0,
        lowCut: 1,
        cutoff: 1500,
        resonance: 0.2,
        envelope: 0.2,
        attack: 0.07,
        release: 0.35,
        chorus: 0,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'dusk-plain-keys',
    name: 'Dusk plain keys',
    category: 'keys',
    description:
      'Saw and square notes that speak at once and close as they settle, with only a small room around them.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 2,
        sub: 0.25,
        cutoff: 700,
        envelope: 0.5,
        attack: 0.003,
        release: 0.9,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room' }],
  },
  {
    id: 'resonant-dusk-sweep',
    name: 'Resonant dusk sweep',
    category: 'pad',
    description:
      'A ringing filter that climbs through the harmonics of a chord for two and a half seconds and sinks back, in a long reverb.',
    instrument: {
      deviceId: 'dusk',
      params: {
        sub: 0.3,
        cutoff: 180,
        resonance: 0.75,
        envelope: 0.6,
        attack: 2.4,
        release: 6,
        chorus: 2,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'inverse-filter-pad',
    name: 'Inverse filter pad',
    category: 'pad',
    description:
      'The envelope turned upside down: a chord darkens as it arrives and its filter opens as it fades, in a hall.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0.2,
        lowCut: 1,
        cutoff: 8000,
        resonance: 0.3,
        envelope: -0.7,
        attack: 1.2,
        release: 7,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'dusty-sine-pad',
    name: 'Dusty sine pad',
    category: 'pad',
    description:
      'The filter singing at the pitch of each key: pure sines that the chorus swells and thins, in a hall, on a worn record with crackle and hiss.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0,
        cutoff: 261.63,
        resonance: 1,
        envelope: 0,
        attack: 0.7,
        release: 3,
        volume: -18.5,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall' },
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { pops: 0.1 } },
    ],
  },
  {
    id: 'filter-ping-bells',
    name: 'Filter ping bells',
    category: 'bell',
    description:
      'The singing filter struck, with the chorus off: a pure ping an octave above each key, bounced by a dotted tape echo in a bright plate.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0,
        lowCut: 1,
        cutoff: 523.25,
        resonance: 1,
        envelope: 0,
        attack: 0.001,
        release: 1.6,
        chorus: 0,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'thin-dusk-strings',
    name: 'Thin dusk strings',
    category: 'string',
    description:
      'Thin sawtooth strings with the lows cut deep and the filter open, easing in under the deeper chorus, in a bright airy hall.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0,
        lowCut: 3,
        cutoff: 9000,
        resonance: 0.05,
        envelope: 0.1,
        attack: 1.3,
        release: 3.2,
        chorus: 2,
        volume: -7.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.45 } }],
  },
  {
    id: 'square-pipe-stack',
    name: 'Square pipe stack',
    category: 'organ',
    description:
      'A plain square wave with the chorus off, stacked with its octaves above and below like organ ranks, in a cathedral.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 1,
        sub: 0.5,
        cutoff: 2200,
        envelope: 0,
        attack: 0.03,
        release: 0.25,
        chorus: 0,
        volume: -17.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'moving-pulse-drone',
    name: 'Moving pulse drone',
    category: 'drone',
    description:
      'A moving pulse over a heavy sub octave through a low resonant filter, slowly phased by a frequency shift in a dark hall.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 3,
        sub: 0.8,
        cutoff: 380,
        resonance: 0.55,
        envelope: 0.2,
        attack: 2.5,
        release: 8,
        chorus: 2,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mode: 2, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'dusk-vowel-choir',
    name: 'Dusk vowel choir',
    category: 'voice',
    description:
      'Saw and square chords sent into a hall that sings an open ah back, so the synth is heard mostly as a wordless choir.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 2,
        sub: 0.2,
        lowCut: 1,
        cutoff: 1400,
        resonance: 0.3,
        envelope: 0.2,
        attack: 0.9,
        release: 3,
        chorus: 2,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { resonance: 0.8, width: 0.6, mix: 0.65 },
      },
    ],
  },
  {
    id: 'gated-dusk-stab',
    name: 'Gated dusk stab',
    category: 'keys',
    description:
      'A short bright stab under both choruses, with a burst of reverb behind each note that holds and then stops dead.',
    instrument: {
      deviceId: 'dusk',
      params: {
        sub: 0.3,
        cutoff: 1500,
        resonance: 0.2,
        envelope: 0.6,
        attack: 0.002,
        release: 0.3,
        chorus: 3,
        volume: -2,
      },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.45, mix: 0.45 } }],
    preview: 'bells',
  },
  {
    id: 'dusk-on-shortwave',
    name: 'Dusk on shortwave',
    category: 'pad',
    description:
      'A soft chorus pad heard over a shortwave link: narrow, rising and sinking in level, with a little static, in a room.',
    instrument: {
      deviceId: 'dusk',
      params: { sub: 0.5, cutoff: 1800, attack: 1.4, release: 4, chorus: 2, volume: -7 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { static: 0.1, interference: 0 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'flanged-dusk-saw',
    name: 'Flanged dusk saw',
    category: 'pad',
    description:
      'A sawtooth with the chorus off and a deep slow flanger sweeping through it instead, easing in to a long plate.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0.2,
        cutoff: 6000,
        resonance: 0.1,
        envelope: 0,
        attack: 1.2,
        release: 4,
        chorus: 0,
      },
    },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Deep dive',
        params: { rate: 0.18, feedback: 70, stereo: 90 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
]
