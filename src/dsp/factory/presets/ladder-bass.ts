import { type FactoryPreset } from '../types'

export const LADDER_BASS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'rolling-sequence-bass',
    name: 'Rolling sequence bass',
    category: 'keys',
    description:
      'Short bass notes that start bright and close, with a tape echo that turns a pattern into a rolling pulse.',
    instrument: { deviceId: 'ladder-bass', preset: 'Sequence bass', params: { volume: -4 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 375, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
    preview: 'line',
  },
  {
    id: 'pedal-drone-hall',
    name: 'Pedal drone',
    category: 'drone',
    description:
      'Two sawtooths beating slowly under a half-closed filter, held for as long as the key is down, in a hall.',
    instrument: { deviceId: 'ladder-bass', preset: 'Pedal drone', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'soft-sub-floor',
    name: 'Soft sub',
    category: 'drone',
    description:
      'A sub tone with almost nothing above it, warmed a little so small speakers can still find it.',
    instrument: { deviceId: 'ladder-bass', preset: 'Soft sub', params: { volume: -15 } },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
    preview: 'low',
  },
  {
    id: 'singing-ladder-lead',
    name: 'Singing lead',
    category: 'keys',
    description:
      'A round solo voice that slides between overlapping notes, with three echoes and a long plate behind it.',
    instrument: { deviceId: 'ladder-bass', preset: 'Singing lead' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'slow-opening-bass',
    name: 'Slow opener',
    category: 'drone',
    description:
      'Each note opens bright and resonant and closes over six seconds, on worn tape in a hall.',
    instrument: { deviceId: 'ladder-bass', preset: 'Slow opener', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'round-finger-bass',
    name: 'Round finger bass',
    category: 'keys',
    description:
      'A round plucked bass that falls away over a few seconds, given weight by a transformer, in a small booth.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 0,
        sub: 0.4,
        cutoff: 170,
        emphasis: 0.05,
        contour: 0.42,
        decay: 4.5,
        drive: 0.35,
        glide: 0.04,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'expanse', preset: 'Small box', params: { lowCut: 200, mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'hollow-square-pedal',
    name: 'Hollow square pedal',
    category: 'drone',
    description:
      'Two square waves over a sub, drifting in and out of step so the held tone hollows and fills every few seconds, in a tight chamber.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 4,
        sub: 0.5,
        cutoff: 700,
        emphasis: 0.1,
        contour: 0,
        decay: 10,
        drive: 0.15,
        glide: 0.1,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
    preview: 'low',
  },
  {
    id: 'raw-saw-lead',
    name: 'Raw saw lead',
    category: 'keys',
    description:
      'Two bright sawtooths over a sub with the filter wide open, buzzing for as long as a key is held and sliding quickly between keys, in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 8,
        sub: 0.5,
        cutoff: 4000,
        emphasis: 0,
        contour: 0.2,
        decay: 10,
        drive: 0.1,
        glide: 0.05,
        volume: -14,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'hollow-reed-lead',
    name: 'Hollow reed lead',
    category: 'wind',
    description:
      'A hollow square tone like a reed pipe, held for as long as the key and given a light vibrato, in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 0,
        cutoff: 1800,
        emphasis: 0.2,
        contour: 0.1,
        decay: 10,
        drive: 0.1,
        glide: 0.1,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 3, rate: 5, depth: 0.35, drift: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'ladder-squelch',
    name: 'Ladder squelch',
    category: 'keys',
    description:
      'A short sawtooth note whose resonant filter yelps shut, sliding between held keys, with clean echoes and a hint of spring.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 0,
        sub: 0,
        cutoff: 180,
        emphasis: 0.85,
        decay: 0.4,
        glide: 0.06,
        volume: 3.8,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'far-ladder-whistle',
    name: 'Far ladder whistle',
    category: 'wind',
    description:
      'A thin held sawtooth with the resonance close to whistling, so a high harmonic sings over each note, echoing far off in a valley.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 0,
        sub: 0,
        cutoff: 1200,
        emphasis: 0.95,
        contour: 0,
        decay: 10,
        drive: 0.05,
        glide: 0.15,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'ticks-on-strings',
    name: 'Ticks on strings',
    category: 'bell',
    description:
      'A tick too short to hear as a note, heard only through the sixteen strings in A minor it sets ringing, levelled so the ring carries.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 0,
        sub: 0,
        cutoff: 1500,
        emphasis: 0.7,
        decay: 0.06,
        glide: 0,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { strings: 12, decay: 6, sympathy: 1, mix: 1 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 32, outputGain: -10 } },
    ],
  },
  {
    id: 'short-square-pluck',
    name: 'Short square pluck',
    category: 'plucked',
    description:
      'A short hollow pluck from square waves in unison, the filter snapping shut in a third of a second, in a small room.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 0,
        emphasis: 0.2,
        contour: 0.5,
        decay: 0.35,
        drive: 0.2,
        glide: 0,
        volume: 0,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'tape-flutter-chime',
    name: 'Tape flutter chime',
    category: 'bell',
    description:
      'Two square waves a fifth of a semitone apart, struck high like a toy chime and beating fast, on fluttering tape in a bright hall.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 20,
        sub: 0,
        cutoff: 2500,
        emphasis: 0.1,
        contour: 0.3,
        decay: 1.4,
        drive: 0.1,
        glide: 0,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer', params: { age: 0.7, mix: 1 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'grinding-fuzz-drone',
    name: 'Grinding fuzz drone',
    category: 'drone',
    description:
      'A held bass driven as hard as it goes and torn further by a pentode fuzz, its two oscillators grinding under a slow phaser.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 14,
        sub: 0.6,
        cutoff: 700,
        emphasis: 0.35,
        contour: 0,
        decay: 10,
        drive: 1,
        glide: 0.2,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Torn cone', params: { output: -6 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 0, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
    preview: 'low',
  },
  {
    id: 'overtone-singer',
    name: 'Overtone singer',
    category: 'drone',
    description:
      'A held open sawtooth under a narrow peak that sweeps slowly up and down through its harmonics, as an overtone singer does, in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 0,
        cutoff: 5000,
        emphasis: 0,
        contour: 0,
        decay: 10,
        drive: 0.2,
        glide: 0.2,
        volume: -22,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 4,
          resonance: 7,
          lfoAmount: 45,
          lfoRateHz: 0.12,
          lfoShape: 1,
        },
      },
      { deviceId: 'vowel-reverb', preset: 'Plain hall', params: { lowCut: 250 } },
    ],
    preview: 'low',
  },
  {
    id: 'organ-pedal-stop',
    name: 'Organ pedal stop',
    category: 'organ',
    description:
      'Square waves in unison and a full sub with octaves added like organ stops, turning slowly in a rotary speaker, in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 1,
        cutoff: 900,
        emphasis: 0,
        contour: 0,
        decay: 10,
        drive: 0.05,
        glide: 0.02,
        volume: -21.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 4, lowCut: 250, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'telegraph-tone',
    name: 'Telegraph tone',
    category: 'texture',
    description:
      'A held square note keyed into bursts of quick dots by two choppers and heard over shortwave with a little static.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 0,
        cutoff: 2600,
        emphasis: 0.5,
        contour: 0,
        decay: 10,
        drive: 0,
        glide: 0,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { rate: 7, depth: 1, shape: 2, drift: 0.3, smooth: 0.05 },
      },
      {
        deviceId: 'tremolo',
        params: { rate: 1.3, depth: 1, shape: 2, drift: 0.6, smooth: 0.05 },
      },
      {
        deviceId: 'radio',
        preset: 'Far station',
        params: { interference: 0, static: 0.1, fading: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bowed-saw-string',
    name: 'Bowed saw string',
    category: 'string',
    description:
      'Two detuned sawtooths faded in over half a second like a bow, spread by an ensemble chorus of three voices, in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 12,
        sub: 0,
        cutoff: 2200,
        emphasis: 0.1,
        contour: 0,
        decay: 10,
        drive: 0.15,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
    preview: 'line',
  },
  {
    id: 'low-monk-drone',
    name: 'Low monk drone',
    category: 'voice',
    description:
      'A held sawtooth bass in a hall that sings a dark oh back at it in low voices, which carry on after the note stops.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        beat: 5,
        sub: 0.2,
        cutoff: 900,
        contour: 0,
        decay: 10,
        glide: 0.2,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks' }],
    preview: 'low',
  },
  {
    id: 'round-ladder-bass',
    name: 'Round ladder bass',
    category: 'bass',
    description:
      'A plain round saw bass that holds while the key is down, with a first hint of tape drive and a trace of a tight chamber.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0,
        beat: 0,
        sub: 0.15,
        cutoff: 300,
        emphasis: 0.05,
        contour: 0.2,
        decay: 10,
        drive: 0.2,
        glide: 0.03,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.08 } },
    ],
  },
  {
    id: 'fast-closing-sequence',
    name: 'Fast closing sequence',
    category: 'bass',
    description:
      'A saw sequence bass whose filter and level snap shut in under half a second, with a brickwall catching each strike.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0,
        beat: 2,
        sub: 0.2,
        cutoff: 300,
        emphasis: 0.3,
        contour: 0.6,
        decay: 0.4,
        drive: 0.4,
        glide: 0,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -9, gain: 6, release: 0.2, ride: 0 } },
    ],
  },
  {
    id: 'soft-ladder-sub',
    name: 'Soft ladder sub',
    category: 'bass',
    description:
      'A soft held sub: a square filtered down to its fundamental and a faint third harmonic, an octave tone under it, tape saturated.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 0.35,
        cutoff: 230,
        emphasis: 0,
        contour: 0,
        decay: 10,
        drive: 0,
        glide: 0.06,
        volume: -12.5,
      },
    },
    effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth' }],
  },
  {
    id: 'slow-ladder-filter-rise',
    name: 'Slow ladder filter rise',
    category: 'bass',
    description:
      'A held saw bass under a second low-pass that opens over eight seconds and closes over the next eight, round after round.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0,
        beat: 0,
        sub: 0.3,
        cutoff: 2500,
        emphasis: 0.1,
        contour: 0,
        decay: 10,
        drive: 0.3,
        glide: 0.05,
        volume: -18,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 250,
          resonance: 1.5,
          lfoAmount: 50,
          lfoRateHz: 0.0625,
          lfoShape: 1,
        },
      },
      { deviceId: 'analog-drive', preset: 'First hint' },
    ],
  },
  {
    id: 'beating-ladder-pair',
    name: 'Beating ladder pair',
    category: 'bass',
    description:
      'Two saws fourteen cents apart swell and fade against each other under a low filter, a steady sub beneath, glued by tape drive.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0,
        beat: 14,
        sub: 0.25,
        cutoff: 280,
        emphasis: 0.05,
        contour: 0,
        decay: 10,
        drive: 0.2,
        glide: 0.05,
        volume: -17,
      },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Warm glue' }],
  },
  {
    id: 'hollow-ladder-square',
    name: 'Hollow ladder square',
    category: 'bass',
    description:
      'A held square bass with no sub under it, hollow and woody, and a short halo of reverb that stays above the bass.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 0,
        cutoff: 500,
        emphasis: 0.1,
        contour: 0.2,
        decay: 10,
        drive: 0.1,
        glide: 0.04,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { lowCut: 250 } }],
  },
  {
    id: 'driven-ladder-growl',
    name: 'Driven ladder growl',
    category: 'bass',
    description:
      'Two saws four cents apart driven flat out into the filter and then a pentode, so the held note grinds and slowly turns.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0,
        beat: 4,
        sub: 0.2,
        cutoff: 900,
        emphasis: 0.4,
        contour: 0.3,
        decay: 10,
        drive: 1,
        glide: 0.05,
        volume: -15.5,
      },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Bite', params: { lowCut: 20, highCut: 5000 } }],
  },
  {
    id: 'gliding-ladder-line',
    name: 'Gliding ladder line',
    category: 'bass',
    description:
      'A saw bass that takes half a second to slide to any key pressed over the last one, with chorus on the overtones only.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0,
        beat: 0,
        sub: 0.2,
        cutoff: 380,
        emphasis: 0.25,
        contour: 0.2,
        decay: 10,
        drive: 0.25,
        glide: 0.45,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'chorus', preset: 'Wide chorus', params: { hpHz: 300, mix: 0.3 } }],
  },
  {
    id: 'dark-ladder-pedal-bass',
    name: 'Dark ladder pedal bass',
    category: 'bass',
    description:
      'A dark pedal note that sinks slowly for as long as it is held, weighted by a tape preamp, with a small dark room above it.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0,
        beat: 0,
        sub: 0.25,
        cutoff: 150,
        emphasis: 0,
        contour: 0.3,
        decay: 9,
        drive: 0.2,
        glide: 0.1,
        volume: -21.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { lowCut: 250, mix: 0.2 } },
    ],
  },
  {
    id: 'resonant-ladder-pluck',
    name: 'Resonant ladder pluck',
    category: 'bass',
    description:
      'A square pluck through a resonant filter that closes in under a second, held at the strike by a limiter, in a small box.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 0.15,
        cutoff: 240,
        emphasis: 0.5,
        contour: 0.7,
        decay: 0.9,
        drive: 0.4,
        glide: 0,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -9, gain: 2, release: 0.2, ride: 0 } },
      { deviceId: 'expanse', preset: 'Small box', params: { lowCut: 250, mix: 0.2 } },
    ],
  },
]
