import { type FactoryPreset } from '../types'

// Every instrument parameter is written out in each preset: the device preset
// named beside them is only the nearest starting point, so a preset here
// sounds the same whatever a device preset's own values become. The bass
// presets run from the softest and longest to the hardest and shortest.

export const FM_BASS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'round-fm-knock',
    name: 'Round FM knock',
    category: 'bass',
    description:
      'A round FM bass whose notes knock bright for a quarter second and settle warm, with the low bump of a transformer in a tight chamber.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Round knock',
      params: {
        ratio: 1,
        depth: 0.62,
        bite: 0.25,
        body: 0.22,
        feedback: 0,
        sub: 0.2,
        decay: 1.8,
        release: 0.15,
        glide: 0.05,
        volume: -11.9,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'soft-fm-sine-floor',
    name: 'Soft FM sine floor',
    category: 'bass',
    description:
      'A barely bent sine that holds while the key is down and fades over a second, with soft tape harmonics so small speakers can find it.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Soft sine',
      params: {
        ratio: 1,
        depth: 0.15,
        bite: 0.5,
        body: 1,
        feedback: 0,
        sub: 0.1,
        decay: 20,
        release: 1.2,
        glide: 0.15,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Soft tape warmth',
        params: { driveDb: 8, outputDb: -17.5 },
      },
    ],
  },
  {
    id: 'blooming-fm-swell',
    name: 'Blooming FM swell',
    category: 'bass',
    description:
      'A warm held tone with its strike taken off, so each note played apart swells in over a quarter second, in a room.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Soft sine',
      params: {
        ratio: 1,
        depth: 0.3,
        bite: 1,
        body: 1,
        feedback: 0,
        sub: 0,
        decay: 20,
        release: 0.25,
        glide: 0.2,
        volume: -13.3,
      },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Slow bow',
        params: { attack: 300, sensitivity: -28, release: 40 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-darkening-fm-bass',
    name: 'Slow darkening FM bass',
    category: 'bass',
    description:
      'Each note starts full and takes four seconds to darken to a round tone, fading for three after the key, on cassette in a small dark room.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Slow dark fall',
      params: {
        ratio: 1,
        depth: 0.42,
        bite: 4,
        body: 0.1,
        feedback: 0,
        sub: 0.3,
        decay: 14,
        release: 3,
        glide: 0.25,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { lowCut: 250, mix: 0.2 } },
    ],
  },
  {
    id: 'slow-sliding-fm-hum',
    name: 'Slow sliding FM hum',
    category: 'bass',
    description:
      'A humming drone that takes a second to slide between held keys and five to fade, with a dark reverb swelling above the bass.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Slow slide drone',
      params: {
        ratio: 1,
        depth: 0.4,
        bite: 4,
        body: 0.7,
        feedback: 0.6,
        sub: 0.4,
        decay: 20,
        release: 5,
        glide: 1,
        volume: -14,
      },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Dark swell',
        params: { lowCut: 300, highCut: 3000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'long-tail-fm-knock',
    name: 'Long tail FM knock',
    category: 'bass',
    description:
      'A soft wooden knock that leaves a pure tone ringing on for seconds after the key, on cassette tape with its low bump full up.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Long tail knock',
      params: {
        ratio: 3,
        depth: 0.55,
        bite: 0.08,
        body: 0.03,
        feedback: 0,
        sub: 0.4,
        decay: 10,
        release: 3,
        glide: 0,
        volume: -16.3,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump', params: { wow: 0.05, flutter: 0.05 } }],
  },
  {
    id: 'dub-fm-tape-weight',
    name: 'Dub FM tape weight',
    category: 'bass',
    description:
      'A warm round bass with a soft strike that hangs for seconds, pushed into tape and a trace of a single dark spring.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Round knock',
      params: {
        ratio: 1,
        depth: 0.38,
        bite: 0.15,
        body: 0.5,
        feedback: 0,
        sub: 0.3,
        decay: 5,
        release: 0.3,
        glide: 0.08,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: -10.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'hollow-fm-slow-pulse',
    name: 'Hollow FM slow pulse',
    category: 'bass',
    description:
      'A hollow note of odd harmonics that takes over a second to lose its edge and a few more to die away, its overtones spread by a chorus.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Hollow pulse',
      params: {
        ratio: 2,
        depth: 0.55,
        bite: 1.5,
        body: 0.45,
        feedback: 0,
        sub: 0.2,
        decay: 3.5,
        release: 0.5,
        glide: 0.06,
        volume: -7.5,
      },
    },
    effects: [{ deviceId: 'chorus', preset: 'Subtle widener', params: { voices: 1, hpHz: 250 } }],
  },
  {
    id: 'hollow-fm-gliding-line',
    name: 'Hollow FM gliding line',
    category: 'bass',
    description:
      'A held hollow bass that takes a third of a second to slide to a key pressed over the last, with a detuned copy on its overtones only.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Rubber bass',
      params: {
        ratio: 2,
        depth: 0.5,
        bite: 0.6,
        body: 0.8,
        feedback: 0.1,
        sub: 0.15,
        decay: 20,
        release: 0.2,
        glide: 0.35,
        volume: -16.5,
      },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Classic', params: { focus: 220 } }],
  },
  {
    id: 'fm-thump-down-the-hall',
    name: 'FM thump down the hall',
    category: 'bass',
    description:
      'A soft short thump in a long dark hall: the note stays dry in the middle and the room answers above it.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Short thump',
      params: {
        ratio: 1,
        depth: 0.55,
        bite: 0.06,
        body: 0,
        feedback: 0,
        sub: 0.2,
        decay: 0.6,
        release: 0.2,
        glide: 0,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'expanse',
        params: { mix: 0.3, size: 0.6, decay: 4, density: 0.9, lowCut: 300, highCut: 3000 },
      },
    ],
  },
  {
    id: 'boxed-wooden-fm-knock',
    name: 'Boxed wooden FM knock',
    category: 'bass',
    description:
      'A short wooden knock: a bend at three times the note that is gone in under a tenth of a second, then a round thud, in a small box.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Wooden knock',
      params: {
        ratio: 3,
        depth: 0.75,
        bite: 0.07,
        body: 0.03,
        feedback: 0,
        sub: 0.15,
        decay: 0.55,
        release: 0.1,
        glide: 0,
        volume: -4.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small box', params: { lowCut: 250, mix: 0.2 } }],
  },
  {
    id: 'fm-sub-click-gate',
    name: 'FM sub click gate',
    category: 'bass',
    description:
      'A hard click on a pure tone with a quieter octave under it, the click alone sent to a gated room that stops dead a third of a second on.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Sub click',
      params: {
        ratio: 4,
        depth: 0.75,
        bite: 0.03,
        body: 0,
        feedback: 0,
        sub: 0.45,
        decay: 1.5,
        release: 0.3,
        glide: 0,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { lowCut: 400, mix: 0.45 } }],
  },
  {
    id: 'rubber-fm-bounce',
    name: 'Rubber FM bounce',
    category: 'bass',
    description:
      'A hollow, bouncing bass with a little rasp, bright for a fifth of a second and gone in one, its strike held down by a driven console.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Rubber bass',
      params: {
        ratio: 2,
        depth: 0.6,
        bite: 0.2,
        body: 0.5,
        feedback: 0.3,
        sub: 0.25,
        decay: 1.2,
        release: 0.07,
        glide: 0.08,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { lowCut: 30, output: -3.3 } },
    ],
  },
  {
    id: 'fm-buzz-under-a-sweep',
    name: 'FM buzz under a sweep',
    category: 'bass',
    description:
      'A buzzing bass with the feedback full up, under a resonant low-pass that opens and closes once every two seconds.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Buzz bass',
      params: {
        ratio: 1,
        depth: 0.42,
        bite: 0.2,
        body: 0.85,
        feedback: 1,
        sub: 0.2,
        decay: 6,
        release: 0.06,
        glide: 0.04,
        volume: -15.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { cutoffHz: 650, resonance: 3, driveDb: 0 },
      },
    ],
  },
  {
    id: 'low-fm-valve-growl',
    name: 'Low FM valve growl',
    category: 'bass',
    description:
      'A held growl: the bending sine fed back on itself until it rasps, then pushed through a hot valve for more edge.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Low growl',
      params: {
        ratio: 1,
        depth: 0.47,
        bite: 0.8,
        body: 0.6,
        feedback: 0.8,
        sub: 0.35,
        decay: 20,
        release: 0.25,
        glide: 0.08,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { wobble: 0, noise: 0, output: -8 } },
    ],
  },
  {
    id: 'hard-short-fm-thump',
    name: 'Hard short FM thump',
    category: 'bass',
    description:
      'The hardest and shortest: a full bend gone in a fiftieth of a second on a note a fifth of a second long, clipped hard for weight.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Short thump',
      params: {
        ratio: 1,
        depth: 1,
        bite: 0.02,
        body: 0,
        feedback: 0,
        sub: 0.1,
        decay: 0.2,
        release: 0.05,
        glide: 0,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Hard clip master',
        params: { driveDb: 12, outputDb: -13 },
      },
    ],
  },
  {
    id: 'held-fm-undertone-hum',
    name: 'Held FM undertone hum',
    category: 'drone',
    description:
      'A very deep held hum an octave under its key, with a soft rasp, its weight moved slowly between the two octaves by a phaser, in a hall.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Held hum',
      params: {
        ratio: 0,
        depth: 0.45,
        bite: 3,
        body: 0.8,
        feedback: 0.45,
        sub: 0.3,
        decay: 20,
        release: 3,
        glide: 0.5,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { centerHz: 500, stereo: 0, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'hum-tone-fm-bell',
    name: 'Hum tone FM bell',
    category: 'bell',
    description:
      'A struck bell of wide-spaced partials that mellows over a second and a half, with a hum an octave under each note, in a hall.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Low bell',
      params: {
        ratio: 5,
        depth: 0.45,
        bite: 1.5,
        body: 0.1,
        feedback: 0,
        sub: 0.35,
        decay: 6,
        release: 2,
        glide: 0,
        volume: -12.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'glass-fm-pluck-echo',
    name: 'Glass FM pluck echo',
    category: 'plucked',
    description:
      'A glassy pluck, the bend at seven times the note: one voice that moves from key to key, with a dark echo and a faint hall behind it.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Glass pluck',
      params: {
        ratio: 6,
        depth: 0.5,
        bite: 0.25,
        body: 0.05,
        feedback: 0,
        sub: 0.25,
        decay: 2.2,
        release: 0.9,
        glide: 0,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'undertone-fm-lead',
    name: 'Undertone FM lead',
    category: 'keys',
    description:
      'A reedy solo voice an octave under its keys, very deep on low ones, that slides between overlapping keys, with a detuned copy, in a room.',
    instrument: {
      deviceId: 'fm-bass',
      preset: 'Deep weight',
      params: {
        ratio: 0,
        depth: 0.55,
        bite: 0.6,
        body: 0.5,
        feedback: 0.3,
        sub: 1,
        decay: 20,
        release: 0.4,
        glide: 0.15,
        volume: -19.6,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { focus: 300 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
]
