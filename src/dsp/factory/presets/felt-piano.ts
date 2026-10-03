import { type FactoryPreset } from '../types'

// Felt is about 15 dB hotter than the other instruments, so every preset
// turns its output down. It is also the most expensive one: the string
// resonance, its own room and a held pedal each add to the cost, so a preset
// keeps what matters to it, leaves the space to a cheaper reverb after it and
// caps the voices.
export const FELT_PIANO_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'close-felt-piano',
    name: 'Close felt piano',
    category: 'keys',
    description:
      'A felted upright heard from inside the lid: hammers, keys and pedal noise, hardly any room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        thump: 0.7,
        action: 0.6,
        pedalNoise: 0.6,
        reverbMix: 0,
        width: 0.8,
        polyphony: 16,
        outputDb: -12,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'slowed-tape-piano',
    name: 'Slowed tape piano',
    category: 'keys',
    description:
      'A soft-pedalled piano that rings on and wavers like a slowed reel, left in a very long hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.85,
        hardness: 0.2,
        detune: 0.75,
        soft: 1,
        sustain: 1,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -11,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.15 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 4500, mix: 0.45, width: 0.7 },
      },
    ],
  },
  {
    id: 'piano-tape-loop',
    name: 'Piano tape loop',
    category: 'keys',
    description:
      'Each phrase is caught on a four second loop of tape that wears away as it repeats.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -12 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 4, feedback: 0.75, wow: 0.5, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bowed-piano',
    name: 'Bowed piano',
    category: 'keys',
    description:
      'The hammer is taken off every note and the pedal held, so chords fade in like bowed strings.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        sustain: 1,
        thump: 0,
        action: 0,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -8,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, mix: 0.5 } },
    ],
  },
  {
    id: 'bare-piano-hall',
    name: 'Bare piano hall',
    category: 'keys',
    description: 'The piano with its felt lifted, brighter and wider, on the stage of a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.7, reverbMix: 0, width: 0.7, polyphony: 16, outputDb: -12 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, lowDecay: 4, mix: 0.4 } },
    ],
  },
  {
    id: 'half-pedal-piano',
    name: 'Half pedal piano',
    category: 'keys',
    description:
      'A thick felt with the pedal half down, so notes fade after the key and other strings answer, on a medium plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.75,
        hardness: 0.25,
        resonance: 0.7,
        reverbMix: 0,
        sustain: 0.4,
        polyphony: 16,
        outputDb: -16,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.22 } }],
  },
  {
    id: 'piano-and-its-room',
    name: 'Piano and its room',
    category: 'keys',
    description:
      'A thin felt and the room built into the instrument, turned up until it is half the sound, levelled by a fast limiter.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.35,
        hardness: 0.45,
        resonance: 0,
        reverbMix: 0.55,
        reverbSize: 0.7,
        width: 0.75,
        polyphony: 16,
        outputDb: -13,
      },
    },
    effects: [
      {
        deviceId: 'limiter-1176',
        preset: 'Gentle lift',
        params: { inputGain: 18, outputGain: -11 },
      },
    ],
  },
  {
    id: 'round-hammer-piano',
    name: 'Round hammer piano',
    category: 'keys',
    description:
      'No felt and very soft hammers: a round strike with no edge on open strings, heard close in a small booth.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.05,
        detune: 0.4,
        thump: 0.6,
        resonance: 0.3,
        reverbMix: 0,
        width: 0.25,
        polyphony: 16,
        outputDb: -15,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
  },
  {
    id: 'pure-bright-piano',
    name: 'Pure bright piano',
    category: 'keys',
    description:
      'Hard hammers on strings tuned dead true with harmonic overtones, so nothing beats, in a bright chamber.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.85,
        detune: 0,
        stiffness: 0,
        thump: 0.15,
        resonance: 0.4,
        reverbMix: 0,
        width: 0.6,
        polyphony: 16,
        outputDb: -10,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'slow-chorus-piano',
    name: 'Slow chorus piano',
    category: 'keys',
    description:
      'A thin felt and strings tuned well apart, thickened by a slow three voice chorus, with a hall that answers late.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.2,
        hardness: 0.3,
        detune: 0.65,
        resonance: 0,
        reverbMix: 0,
        polyphony: 16,
        outputDb: -12.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.42 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'damped-felt-plucks',
    name: 'Damped felt plucks',
    category: 'plucked',
    description:
      'The thickest felt and dampers that shut at once: short muffled notes evened by a fast limiter, with a slap echo and a spring.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 1,
        hardness: 0.55,
        grit: 0,
        damper: 1,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', preset: 'Drive', params: { inputGain: 20, outputGain: -5 } },
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.2 } },
    ],
    preview: 'bells',
  },
  {
    id: 'stiff-wire-bells',
    name: 'Stiff wire bells',
    category: 'bell',
    description:
      'Strings as stiff as they go, left undamped, so each strike has the sharp overtones of a bell, under a halo two octaves up.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.1,
        hardness: 0.7,
        detune: 0.05,
        stiffness: 2,
        thump: 0.05,
        resonance: 0,
        reverbMix: 0,
        sustain: 1,
        polyphony: 8,
        outputDb: -10,
      },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Glass' }],
  },
  {
    id: 'gritty-tremolo-piano',
    name: 'Gritty tremolo piano',
    category: 'keys',
    description:
      'The driven copy of the piano turned right up and narrowed, pulsing in a tremolo with a two spring tank.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.35,
        hardness: 0.5,
        thump: 0.6,
        grit: 1,
        resonance: 0,
        reverbMix: 0,
        width: 0.3,
        polyphony: 12,
        outputDb: -13,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.65 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'only-the-piano-room',
    name: 'Only the piano room',
    category: 'keys',
    description:
      'The direct piano is taken away and only its own room is left, two seconds of tail thinned at both ends as if far off.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.3,
        hardness: 0.5,
        resonance: 0,
        reverbMix: 1,
        reverbSize: 0.85,
        width: 0.7,
        polyphony: 12,
        outputDb: -10,
      },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Distant' }],
  },
  {
    id: 'kitchen-radio-piano',
    name: 'Kitchen radio piano',
    category: 'keys',
    description:
      'A mono piano in a studio room, broadcast on medium wave and heard from a small boxy speaker in a short room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.3,
        hardness: 0.5,
        grit: 0.2,
        resonance: 0,
        reverbMix: 0.2,
        reverbSize: 0.35,
        width: 0,
        polyphony: 12,
        outputDb: -15.5,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.1, interference: 0 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'piano-string-drone',
    name: 'Piano string drone',
    category: 'drone',
    description:
      'Soft hammers with the pedal down and all the other strings ringing along, under a slowly moving low pass in a deep, dark space.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.4,
        hardness: 0.15,
        thump: 0.9,
        resonance: 1,
        reverbMix: 0,
        sustain: 1,
        polyphony: 8,
        outputDb: -20,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'dotted-echo-piano',
    name: 'Dotted echo piano',
    category: 'keys',
    description:
      'The hardest hammers through a thick felt: a clear tick on a soft note, with dotted tape echoes that start left and bounce across.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.7,
        hardness: 1,
        thump: 0.2,
        resonance: 0,
        reverbMix: 0,
        width: 0.1,
        polyphony: 12,
        outputDb: -13.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { spread: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'pattering-felt-thuds',
    name: 'Pattering felt thuds',
    category: 'plucked',
    description:
      'The thickest felt, the softest hammers and the thump turned right up: dull thuds that patter in a cave of short echoes.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 1,
        hardness: 0,
        thump: 1,
        resonance: 0,
        reverbMix: 0,
        width: 0.25,
        soft: 1,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering' }],
  },
  {
    id: 'caught-piano-chord',
    name: 'Caught piano chord',
    category: 'pad',
    description:
      'A soft, detuned piano whose every chord is caught and held under it as a slow pad that hangs on in a warm hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.75,
        hardness: 0.2,
        detune: 0.7,
        thump: 0.15,
        resonance: 0,
        reverbMix: 0,
        soft: 1,
        polyphony: 12,
        outputDb: -13.5,
      },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'zita-rev1', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'glass-octave-piano',
    name: 'Glass octave piano',
    category: 'keys',
    description:
      'A soft, nearly harmonic piano with one and two octaves added above every note, spread across the sides in a bright plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.45,
        hardness: 0.3,
        detune: 0.2,
        stiffness: 0.4,
        resonance: 0,
        reverbMix: 0,
        width: 0.7,
        polyphony: 12,
        outputDb: -11.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up1: 0.35, up2: 0.3 } },
      { deviceId: 'dattorro', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
]
