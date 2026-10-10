import { type FactoryPreset } from '../types'

export const BOWED_STRING_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'sustained-octave-line',
    name: 'Sustainer at the octave',
    category: 'string',
    description:
      'A guitar string held by a magnetic sustainer pressed hard, so each note blooms and tips into its octave.',
    instrument: { deviceId: 'bowed-string', preset: 'Octave feedback', params: { volume: -5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  {
    id: 'solo-cello-cathedral',
    name: 'Cathedral cello',
    category: 'string',
    description:
      'One bowed string with a wooden body and a slow vibrato, for low notes held in a nave.',
    instrument: { deviceId: 'bowed-string', preset: 'Cello drone', params: { volume: -13 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'low',
  },
  {
    id: 'glass-bow-harmonics',
    name: 'Glass bow',
    category: 'string',
    description:
      'A light bow that takes seconds to speak, pure as a flute, with a halo two octaves above it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { brightness: 0.9, pressure: 0.25, detune: 0, volume: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.4, shimmer: 0.6 } },
    ],
  },
  {
    id: 'volume-swell-guitar',
    name: 'Volume swell guitar',
    category: 'string',
    description:
      'Plucked chords with the pick attack faded out, as with a volume pedal, into echo and plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 1.5, decay: 25, volume: -2 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.4, decay: 0.8 } },
    ],
  },
  {
    id: 'felt-guitar-tremolo',
    name: 'Felt guitar',
    category: 'string',
    description:
      'A soft, dark pluck near the middle of the string, through amp tremolo and a spring.',
    instrument: { deviceId: 'bowed-string', preset: 'Felt guitar', params: { volume: -6 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.5, depth: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
    preview: 'keys',
  },
  {
    id: 'close-pizzicato',
    name: 'Close pizzicato',
    category: 'plucked',
    description:
      'A short, round finger pluck on one string with a lot of wooden body, close in a small chamber, hard chords held by a limiter.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 0,
        attack: 0.005,
        release: 0.25,
        brightness: 0.42,
        decay: 0.9,
        position: 0.2,
        body: 0.9,
        vibrato: 0,
        detune: 0,
        volume: 1.5,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'steel-wire-pluck',
    name: 'Steel wire pluck',
    category: 'plucked',
    description:
      'A thin steel string picked right at the bridge, bright and wiry, its pick rounded by soft saturation, on a bright plate.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 0,
        attack: 0.005,
        release: 3,
        brightness: 0.92,
        decay: 8,
        position: 0.03,
        body: 0.15,
        vibrato: 0,
        detune: 3,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Warm glue',
        params: { driveDb: 12, toneDb: 0, outputDb: -8.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'hollow-bow-swell',
    name: 'Hollow bow swell',
    category: 'string',
    description:
      'Strings bowed at the middle, where every second overtone drops out and the tone goes hollow, swelling in over seconds in a vast nave.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 6,
        release: 10,
        decay: 15,
        position: 0.5,
        pressure: 0.72,
        body: 0.3,
        vibrato: 0.06,
        detune: 10,
        volume: -11.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } }],
  },
  {
    id: 'pure-dark-strings',
    name: 'Pure dark strings',
    category: 'pad',
    description:
      'Strings held singing as near pure tones, all brightness off and no vibrato, slow to rise, in a large open space with a long tail.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 4,
        release: 7,
        brightness: 0,
        decay: 12,
        pressure: 0,
        body: 1,
        vibrato: 0,
        detune: 0,
        volume: -14,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley' }],
  },
  {
    id: 'bow-line-and-section',
    name: 'Bow line and section',
    category: 'string',
    description:
      'One bowed line with a slow vibrato whose notes ring on and overlap, a soft string section swelling in behind it, in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 0.9,
        release: 9,
        decay: 12,
        pressure: 0.45,
        body: 0.6,
        vibrato: 0.3,
        vibratoRate: 4.4,
        detune: 0,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 2, width: 0, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.45 } },
    ],
    preview: 'line',
  },
  {
    id: 'short-bow-strokes',
    name: 'Short bow strokes',
    category: 'string',
    description:
      'Quick separate strokes of a firm bow on a string with a wooden body, speaking at once and stopping soon after the key, in a room.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 0.04,
        release: 0.3,
        brightness: 0.55,
        position: 0.12,
        pressure: 0.6,
        body: 0.75,
        vibrato: 0,
        detune: 0,
        volume: -11,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
    preview: 'keys',
  },
  {
    id: 'bridge-bow-tremolo',
    name: 'Bridge bow tremolo',
    category: 'string',
    description:
      'A hard bow close to the bridge, edgy with rosin, its level shaking fast like a tremolo bow, far back in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 0.5,
        release: 1.2,
        brightness: 1,
        position: 0.03,
        pressure: 0.85,
        body: 0.15,
        vibrato: 0,
        detune: 5,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { rate: 11, depth: 0.8, shape: 1, drift: 0.35, smooth: 0.1 },
      },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'soft-bow-section',
    name: 'Soft bow section',
    category: 'pad',
    description:
      'Light bows with a shared vibrato, thickened by an ensemble chorus into a soft section in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 1.1,
        release: 2.2,
        brightness: 0.3,
        pressure: 0.3,
        body: 0.55,
        vibrato: 0.22,
        vibratoRate: 5.6,
        detune: 14,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'fiddle-wide-vibrato',
    name: 'Fiddle wide vibrato',
    category: 'string',
    description:
      'One bowed string that speaks fast and shakes with a wide, quick vibrato, for a line on a small plate.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 0.12,
        release: 0.5,
        brightness: 0.85,
        position: 0.08,
        pressure: 0.6,
        vibrato: 0.65,
        vibratoRate: 6.8,
        detune: 0,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
    preview: 'line',
  },
  {
    id: 'hollow-wire-organ',
    name: 'Hollow wire organ',
    category: 'organ',
    description:
      'A string held by a sustainer barely touching it, a plain tone with its twelfth, keyed like an organ in a rotary speaker.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 0.02,
        release: 0.12,
        brightness: 1,
        pressure: 0,
        body: 0,
        vibrato: 0,
        detune: 0,
        volume: -19,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'beating-wire-drone',
    name: 'Beating wire drone',
    category: 'drone',
    description:
      'Each low note is two strings an eighth of a tone apart, held singing so they beat, thickened by a transformer in a dark cave.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 1.8,
        release: 5,
        brightness: 0.3,
        pressure: 0.35,
        body: 0.7,
        vibrato: 0,
        detune: 25,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'seasick-wire',
    name: 'Seasick wire',
    category: 'string',
    description:
      'A held string whose pitch sways slowly and widely, played back from a hissing cassette on a small plate.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 0.5,
        pressure: 0.55,
        body: 0.35,
        vibrato: 0.9,
        vibratoRate: 2.2,
        detune: 4,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ringing-psaltery',
    name: 'Ringing psaltery',
    category: 'plucked',
    description:
      'Bright paired strings struck and left to ring, with strings tuned to A minor answering them in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 0,
        attack: 0.01,
        release: 15,
        brightness: 0.93,
        decay: 30,
        position: 0.11,
        body: 0.3,
        vibrato: 0,
        detune: 11,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.45 } },
    ],
    preview: 'bells',
  },
  {
    id: 'bow-on-shortwave',
    name: 'Bow on shortwave',
    category: 'texture',
    description:
      'A rough, heavy bow on two strings over a night radio link that fades, with static that carries on after the bow stops, in a dark hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 0.8,
        brightness: 0.85,
        position: 0.08,
        pressure: 1,
        body: 0.5,
        vibrato: 0.12,
        vibratoRate: 4,
        detune: 18,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'plucks-turned-back',
    name: 'Plucks turned back',
    category: 'plucked',
    description:
      'Plucks heard only as echoes over half a second late, first backwards and then forwards, on a plate.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 0,
        attack: 0.08,
        release: 1.5,
        brightness: 0.7,
        decay: 2.2,
        position: 0.16,
        body: 0.3,
        vibrato: 0,
        detune: 7,
        volume: 2.5,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { time: 600, feedback: 0.35 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'one-string-arco-bass',
    name: 'One string arco bass',
    category: 'bass',
    description:
      'One bowed low string with a full wooden body that takes a moment to speak, set in the centre, with a little room.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 2,
        attack: 0.1,
        release: 0.5,
        brightness: 0.4,
        pressure: 0.5,
        body: 0.8,
        vibrato: 0.05,
        detune: 0,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Mono cabinet',
        params: { hornDepth: 0, drumDepth: 0, drive: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
  },
]
