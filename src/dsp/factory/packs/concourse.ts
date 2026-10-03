import { type FactoryPreset } from '../types'

// A few soft notes, glass bells and held vowels on loops and long delays of unequal length,
// with slowed tape and an octave halo: a large quiet building when nothing is leaving.

export const PRESETS: readonly FactoryPreset[] = [
  // Tine piano: the soft electric piano of the loops.
  {
    id: 'concourse-unequal-loops',
    name: 'Unequal loops',
    category: 'keys',
    description:
      'Soft tines on two tape loops of unequal length, so the repeats never fall together the same way twice.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.5,
        bark: 0.15,
        decay: 1.6,
        release: 0.9,
        hardness: 0.45,
        tremolo: 0,
        tone: 0.45,
        drive: 0.05,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 3.1, feedback: 0.6, wear: 0.35, wow: 0.25, spread: 0.4, mix: 0.4 },
      },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 4.7, feedback: 0.55, wear: 0.45, wow: 0.15, spread: 0.6, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-half-speed-tines',
    name: 'Half-speed tines',
    category: 'keys',
    description:
      'An electric piano slowed to half speed on tape: an octave down and soft-edged, in a long plate.',
    instrument: {
      deviceId: 'tine-piano',
      params: {
        bell: 0.6,
        bark: 0.2,
        decay: 1.3,
        release: 0.6,
        hardness: 0.6,
        tremolo: 0,
        tone: 0.6,
        drive: 0.1,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 3000 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, hiss: 0.15 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-glass-wall-tines',
    name: 'Glass wall tines',
    category: 'keys',
    description:
      'Bell-like tines with a copy a few cents sharp on the left and flat on the right, in a vast room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: {
        bell: 0.95,
        bark: 0.1,
        decay: 1.8,
        release: 1,
        hardness: 0.7,
        tremolo: 0,
        tone: 0.7,
        volume: -15,
      },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        preset: 'Classic',
        params: { detune: 11, delay: 18, drift: 0.35, mix: 0.4 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 8000, mix: 0.35, width: 0.8 },
      },
    ],
  },
  {
    id: 'concourse-late-arrival',
    name: 'Late arrival',
    category: 'keys',
    description:
      'Dark round tines into a two-second tape delay whose repeats dull each time round, then a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: {
        bell: 0.2,
        bark: 0.15,
        decay: 1.4,
        release: 0.6,
        hardness: 0.35,
        tone: 0.3,
        volume: -13,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 2000,
          feedback: 0.62,
          wow: 0.3,
          flutter: 0.1,
          drive: 0.25,
          lowCut: 150,
          highCut: 3200,
          spread: 0.5,
          mix: 0.4,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'concourse-soft-landing',
    name: 'Soft landing',
    category: 'keys',
    description:
      'Tines with the strike faded off each note, left to climb an octave in a long reverb.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: {
        bell: 0.7,
        bark: 0.1,
        decay: 3,
        release: 2,
        hardness: 0.5,
        tremolo: 0,
        tone: 0.5,
        volume: -16.5,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 500, release: 300 } },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 20, shimmer: 0.4, tone: 5000, mix: 0.45 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'concourse-moving-walkway',
    name: 'Moving walkway',
    category: 'keys',
    description:
      'Long tines carried slowly from one side to the other by their own tremolo, in a slow chorus and a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: {
        bell: 0.5,
        bark: 0.2,
        decay: 2.2,
        release: 1.2,
        hardness: 0.55,
        tremolo: 0.8,
        tremoloRate: 0.25,
        tone: 0.5,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'chorus',
        preset: 'Deep sea',
        params: {
          rate: 0.08,
          depth: 55,
          delayMs: 25,
          spread: 100,
          feedback: 0,
          hpHz: 20,
          mix: 0.35,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 5, mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-night-freight',
    name: 'Night freight',
    category: 'keys',
    description:
      'Low dark tines with an echo that brings back moments from the last minute, some of them backwards.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: {
        bell: 0.05,
        bark: 0.3,
        decay: 2.5,
        release: 1.5,
        hardness: 0.3,
        tone: 0.2,
        drive: 0.2,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.4, hiss: 0.1 } },
      {
        deviceId: 'echo-memory',
        preset: 'Far back',
        params: { time: 1100, feedback: 0.45, vary: 0.5, tone: 3500, mix: 0.4 },
      },
      { deviceId: 'dattorro', params: { decay: 0.8, damping: 0.5, mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Felt piano: single notes, slowed, turned round or with the hammer taken off.
  {
    id: 'concourse-unattended-piano',
    name: 'Unattended piano',
    category: 'keys',
    description:
      'A soft upright that nobody is playing for, heard across a hard, empty hall with its own low room tone.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.6,
        hardness: 0.3,
        thump: 0.4,
        action: 0.3,
        pedalNoise: 0.2,
        resonance: 0,
        reverbMix: 0,
        width: 0.6,
        polyphony: 12,
        outputDb: -14.5,
      },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -44 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { preDelay: 90, lowDecay: 5, midDecay: 4.5, damping: 5000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'concourse-slowed-piano-loop',
    name: 'Slowed piano loop',
    category: 'keys',
    description:
      'Piano notes slowed to half speed and laid on a six-second loop of tape that wears a little more each pass.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.5,
        hardness: 0.45,
        thump: 0.3,
        action: 0.2,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 10,
        outputDb: -13.5,
      },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 3200, highCut: 6000 },
      },
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { length: 5.9, feedback: 0.65, wear: 0.45, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-soft-pedal-double',
    name: 'Soft pedal double',
    category: 'keys',
    description:
      'A piano on its soft pedal with the dampers lifted, doubled a few cents either side and hung in a long dark room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.85,
        hardness: 0.2,
        detune: 0.6,
        thump: 0.25,
        action: 0.15,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        soft: 1,
        sustain: 1,
        polyphony: 10,
        outputDb: -9,
      },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        params: { detune: 12, delay: 18, drift: 0.45, focus: 250, tone: 3500, mix: 0.38 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, highCut: 4000, modDepth: 0.5, mix: 0.4, width: 0.8 },
      },
    ],
  },
  {
    id: 'concourse-backwards-piano',
    name: 'Backwards piano',
    category: 'keys',
    description:
      'Piano notes turned round on the tape so each swells up to where its hammer was, in a long plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.5,
        hardness: 0.4,
        thump: 0.2,
        action: 0.1,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 10,
        outputDb: -12,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1800, feedback: 0.15, smooth: 0.8, mix: 0.85 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-hammerless-piano',
    name: 'Hammerless piano',
    category: 'keys',
    description:
      'The hammer is faded off every note and the pedal held, so chords have no strike, under an octave halo.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.6,
        sustain: 1,
        thump: 0,
        action: 0,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 8,
        outputDb: -9,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 900 } },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 16, shimmer: 0.35, tone: 5500, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'concourse-rotating-piano',
    name: 'Rotating piano',
    category: 'keys',
    description:
      'A piano played through a slowly rotating speaker cabinet, turning gently, with a long plate behind it.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.2,
        hardness: 0.5,
        thump: 0.3,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -13,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { hornDepth: 0.7, drive: 0.15, distance: 0.5, spread: 0.9 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { decay: 0.8, mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-prepared-piano',
    name: 'Prepared piano',
    category: 'keys',
    description:
      'A piano with things laid on its strings: stiff, bell-like, a little out of tune, each note cut short, with a dotted tape echo.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.1,
        hardness: 0.6,
        detune: 0.75,
        stiffness: 1.8,
        thump: 0.5,
        damper: 0.9,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 420,
          feedback: 0.4,
          heads: 3,
          wow: 0.2,
          highCut: 3500,
          mix: 0.3,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // Glass: the bells and pads of an eighties FM synth.
  {
    id: 'concourse-glass-bell-halo',
    name: 'Glass bell halo',
    category: 'bell',
    description:
      'Glassy FM bells, softly struck, in a reverb that climbs an octave above them as it fades.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: {
        brightness: 0.46,
        decay: 3.5,
        attack: 0.01,
        release: 5,
        detune: 7,
        feedback: 0.05,
        velocity: 0.4,
        spread: 0.5,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 12, shimmer: 0.5, tone: 5500, predelay: 40, mix: 0.4 },
      },
    ],
  },
  {
    id: 'concourse-slow-glass-pad',
    name: 'Slow glass pad',
    category: 'pad',
    description:
      'A held FM pad of glass overtones that takes three seconds to arrive, on tape in a vast open space.',
    instrument: {
      deviceId: 'fm-glass',
      params: {
        algorithm: 3,
        ratio: 3,
        brightness: 0.28,
        decay: 8,
        sustain: 1,
        attack: 3,
        release: 7,
        detune: 11,
        feedback: 0.1,
        spread: 0.7,
        volume: -21,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, wow: 0.15 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.35, width: 0.8 } },
    ],
  },
  {
    id: 'concourse-dark-mallet',
    name: 'Dark mallet',
    category: 'bell',
    description:
      'A dark, round FM mallet for a few low notes far apart, in a hall with a long dull tail.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        ratio: 1,
        brightness: 0.18,
        decay: 3,
        attack: 0.004,
        release: 2.5,
        detune: 2,
        velocity: 0.5,
        spread: 0.3,
        volume: -15.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { tone: 0.35, hiss: 0.1 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2800, mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'concourse-chime-loops',
    name: 'Chime loops',
    category: 'bell',
    description:
      'Short glass chimes on two tape loops of different lengths that slip steadily out of step.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: {
        ratio: 7,
        brightness: 0.4,
        decay: 1.2,
        release: 3,
        detune: 6,
        velocity: 0.5,
        spread: 0.6,
        volume: -1,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2.3, feedback: 0.62, wear: 0.4, spread: 0.7, mix: 0.4 },
      },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 3.7, feedback: 0.55, wear: 0.5, wow: 0.3, mix: 0.35 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'concourse-beating-bells',
    name: 'Beating bells',
    category: 'bell',
    description:
      'Inharmonic FM bells whose detuned halves beat slowly from side to side, with a long tape delay.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: {
        ratio: 4,
        brightness: 0.5,
        decay: 5,
        attack: 0.005,
        release: 6,
        detune: 14,
        feedback: 0.15,
        velocity: 0.5,
        spread: 0.6,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1700,
          feedback: 0.55,
          wow: 0.35,
          flutter: 0.1,
          drive: 0.2,
          highCut: 3600,
          spread: 0.3,
          mix: 0.35,
        },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 9, highCut: 5000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'concourse-digital-tines',
    name: 'Digital tines',
    category: 'keys',
    description:
      'The electric piano of an eighties FM synth, through twelve-bit converters and a chorus, on a plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: {
        brightness: 0.4,
        decay: 2.2,
        release: 1.2,
        detune: 6,
        feedback: 0.25,
        velocity: 0.6,
        spread: 0.6,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, depth: 40, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { decay: 0.8, mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-singing-glass',
    name: 'Singing glass',
    category: 'pad',
    description: 'Slow glass tones in a hall that sings a soft ah back at them.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: {
        brightness: 0.25,
        attack: 2,
        release: 7,
        sustain: 0.7,
        detune: 9,
        spread: 0.8,
        volume: -15,
      },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { resonance: 0.65, voice: 0.6, motion: 0.4, decay: 8, mix: 0.45 },
      },
    ],
  },

  // Choir: wordless vowels, one pitch to a loop.
  {
    id: 'concourse-vowel-loops',
    name: 'Vowel loops',
    category: 'voice',
    description:
      'A few voices holding one ah without vibrato, on two tape loops of unequal length in a hall.',
    instrument: {
      deviceId: 'choir',
      params: {
        vowel: 0.04,
        voice: 1.18,
        motion: 0.15,
        breath: 0.3,
        ensemble: 0.6,
        vibrato: 0,
        attack: 1.4,
        release: 3.5,
        tone: 6000,
        width: 0.7,
        volume: -8.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 3.3, feedback: 0.6, wear: 0.35, wow: 0.25, spread: 0.5, mix: 0.4 },
      },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 5.1, feedback: 0.55, wear: 0.4, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-one-singer',
    name: 'One singer',
    category: 'voice',
    description:
      'One singer on one vowel with hardly any vibrato, on slightly unsteady tape in a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.05,
        voice: 1.2,
        motion: 0.1,
        breath: 0.25,
        vibrato: 6,
        attack: 0.8,
        release: 2.5,
        tone: 6500,
        width: 0.3,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, hiss: 0.15 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { predelayMs: 60, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'concourse-half-speed-voices',
    name: 'Half-speed voices',
    category: 'voice',
    description:
      'Sung vowels slowed to half speed on tape: an octave lower, darker, the pitch a little unsteady.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: {
        vowel: 0.75,
        voice: 1.1,
        motion: 0.3,
        vibrato: 0,
        attack: 1,
        release: 3,
        tone: 4500,
        width: 0.6,
        volume: -9.5,
      },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 3500, highCut: 5000, spread: 0.4 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.45, age: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-cabin-air',
    name: 'Cabin air',
    category: 'voice',
    description:
      'Breathy voices that change vowel slowly as they hold, more air than tone, in a wide open space.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: {
        vowel: 0.2,
        voice: 1.22,
        motion: 0.9,
        breath: 0.85,
        ensemble: 0.9,
        attack: 3,
        release: 6,
        tone: 8000,
        width: 0.9,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 12, mix: 0.35 } }],
  },
  {
    id: 'concourse-oo-and-halo',
    name: 'Oo and halo',
    category: 'voice',
    description:
      'Women on a closed oo, slow to enter and without vibrato, doubled either side under an octave halo.',
    instrument: {
      deviceId: 'choir',
      params: {
        vowel: 1,
        voice: 1.2,
        motion: 0.1,
        breath: 0.2,
        ensemble: 0.7,
        vibrato: 0,
        attack: 2.5,
        release: 5,
        tone: 7000,
        width: 0.7,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { mix: 0.3 } },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 16, shimmer: 0.45, mix: 0.35, width: 0.8 },
      },
    ],
  },
  {
    id: 'concourse-round-of-one',
    name: 'Round of one',
    category: 'voice',
    description:
      'A sung line fed to a two-second tape delay, so each note is still sounding under the next.',
    instrument: {
      deviceId: 'choir',
      params: {
        vowel: 0.9,
        voice: 1.15,
        motion: 0.2,
        breath: 0.2,
        ensemble: 0.4,
        vibrato: 4,
        attack: 0.6,
        release: 2,
        tone: 5500,
        width: 0.6,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 2000,
          feedback: 0.7,
          wow: 0.3,
          flutter: 0.1,
          drive: 0.2,
          highCut: 4000,
          spread: 0.4,
          mix: 0.45,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'concourse-far-end-voices',
    name: 'Far end voices',
    category: 'voice',
    description:
      'Low voices on a closed oh, played through a speaker at the far end of a hall and heard from here.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: {
        vowel: 0.8,
        voice: 0.92,
        motion: 0.15,
        attack: 2,
        release: 5,
        tone: 3000,
        width: 0.4,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { drive: 0.15, distance: 0.7, room: 0.6, noise: 0.05 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },

  // Bells: struck and rubbed metal and glass, left to ring.
  {
    id: 'concourse-stretched-bell',
    name: 'Stretched bell',
    category: 'bell',
    description:
      'A church bell with its overtones spread a little wider than true, struck softly, in a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        decay: 20,
        damping: 0.5,
        hardness: 0.4,
        position: 0.1,
        detune: 0.8,
        stretch: 1.12,
        brightness: 0.45,
        spread: 0.5,
        volume: -3,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.4, mix: 0.3 } }],
  },
  {
    id: 'concourse-glass-rim-loop',
    name: 'Glass rim loop',
    category: 'bell',
    description:
      'Rubbed glass rims singing on a four-second tape loop, each pass a little duller than the last.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: {
        decay: 10,
        hardness: 0.1,
        detune: 1.2,
        sustain: 1,
        brightness: 0.35,
        release: 0.2,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4.3, feedback: 0.62, wear: 0.4, spread: 0.5, mix: 0.45 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'concourse-bowl-and-return',
    name: 'Bowl and return',
    category: 'bell',
    description:
      'Struck bronze bowls with a long two-head tape delay that hands each note back darker.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        decay: 14,
        hardness: 0.35,
        detune: 1.2,
        brightness: 0.45,
        release: 0.1,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1650,
          feedback: 0.6,
          heads: 1,
          wow: 0.3,
          flutter: 0.1,
          drive: 0.2,
          highCut: 3000,
          spread: 0.7,
          mix: 0.4,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-boarding-chime',
    name: 'Boarding chime',
    category: 'bell',
    description:
      'Small chime bars struck with a soft mallet, under a reverb that lifts them an octave.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        decay: 5,
        damping: 0.35,
        hardness: 0.45,
        position: 0.2,
        detune: 0.6,
        brightness: 0.5,
        release: 0.1,
        spread: 0.6,
        volume: 4,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 9, shimmer: 0.4, tone: 6500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'concourse-still-vibraphone',
    name: 'Still vibraphone',
    category: 'bell',
    description:
      'Vibraphone bars with the motor off and the pedal down, widened a few cents either side, in a hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 9, hardness: 0.25, detune: 0.4, release: 0.2, spread: 0.4, volume: -5 },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        preset: 'Classic',
        params: { detune: 7, drift: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 5, mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-backwards-gong',
    name: 'Backwards gong',
    category: 'bell',
    description:
      'A large gong heard backwards as well as forwards, its tail swelling up toward the strike, in a long hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        decay: 14,
        damping: 0.35,
        hardness: 0.6,
        brightness: 0.6,
        spread: 0.7,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 3000, feedback: 0.2, smooth: 0.7, tone: 4000, spread: 0.2, mix: 0.7 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // Wavetable: slow tables, one for each kind of light in the building.
  {
    id: 'concourse-slow-vowel-loop',
    name: 'Slow vowel loop',
    category: 'pad',
    description:
      'A synthetic choir that slowly changes vowel, layered again on a tape loop a little longer than the chord.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        position: 0.2,
        motion: 0.6,
        rate: 0.04,
        detune: 10,
        cutoff: 3500,
        attack: 2,
        spread: 0.7,
        volume: -10.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 5.3, feedback: 0.65, wear: 0.35, spread: 0.4, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-skylight-glass',
    name: 'Skylight glass',
    category: 'pad',
    description:
      'Glass overtones drifting across a held chord, three seconds in arriving, with an octave halo above.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.45,
        motion: 0.5,
        rate: 0.07,
        detune: 8,
        sub: 0.15,
        cutoff: 5500,
        attack: 3,
        release: 6,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 12, shimmer: 0.4, mix: 0.35, width: 0.8 },
      },
    ],
  },
  {
    id: 'concourse-rotor-reed',
    name: 'Rotor reed',
    category: 'pad',
    description:
      'A soft reed tone that opens a little toward a saw as it holds, through a slowly rotating speaker.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.1,
        motion: 0.3,
        rate: 0.08,
        detune: 5,
        sub: 0.3,
        cutoff: 2200,
        attack: 0.5,
        release: 2.5,
        spread: 0.4,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { drive: 0.05 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'concourse-hollow-floor',
    name: 'Hollow floor',
    category: 'pad',
    description:
      'A dark hollow tone over a strong sub octave, for the bottom of a piece, on tape in a huge room.',
    instrument: {
      deviceId: 'wavetable',
      params: {
        table: 3,
        position: 0.3,
        detune: 12,
        attack: 3,
        spread: 0.8,
        motion: 0.5,
        rate: 0.05,
        sub: 0.6,
        cutoff: 600,
        resonance: 0.2,
        release: 7,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 3500, mix: 0.3 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'concourse-cloud-ceiling',
    name: 'Cloud ceiling',
    category: 'pad',
    description:
      'Shifting groups of partials that take five seconds to arrive, broken into a soft cloud of grains.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: {
        motion: 0.9,
        detune: 14,
        sub: 0.1,
        cutoff: 7000,
        release: 9,
        spread: 0.7,
        volume: -11.5,
      },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { size: 320, mix: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, highCut: 6000, mix: 0.4, width: 0.8 },
      },
    ],
  },
  {
    id: 'concourse-still-tones',
    name: 'Still tones',
    category: 'pad',
    description:
      'Nearly pure tones with no movement of their own, turned only by a slow frequency shift and a breathing hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: {
        detune: 3,
        sub: 0.3,
        cutoff: 1500,
        attack: 1.5,
        release: 5,
        spread: 0.3,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', params: { fine: 0.25, feedback: 0.4, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7, mix: 0.4 } },
    ],
  },

  // Dusk: the chorus polysynth as strings, a slow filter, a lead and a floor.
  {
    id: 'concourse-late-chorus-strings',
    name: 'Late chorus strings',
    category: 'pad',
    description:
      'The chorus polysynth as a soft string pad, two and a half seconds in arriving, on tape in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { cutoff: 1500, envelope: 0.2, attack: 2.5, release: 5, volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-doors-opening',
    name: 'Doors opening',
    category: 'pad',
    description:
      'A dark chord whose filter opens over four seconds and closes over nine, in a vast room.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 2,
        sub: 0.5,
        cutoff: 280,
        resonance: 0.3,
        envelope: 0.8,
        attack: 4,
        release: 9,
        chorus: 2,
        volume: -11.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.35 } }],
  },
  {
    id: 'concourse-singing-filter-loop',
    name: 'Singing filter loop',
    category: 'pad',
    description:
      'The filter singing by itself, close to a sine, into a four-second tape loop that keeps the last few phrases.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.5, release: 3, volume: -9 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4.2, feedback: 0.7, wear: 0.3, spread: 0.5, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'concourse-landing-lights',
    name: 'Landing lights',
    category: 'pad',
    description:
      'A thin moving pulse with its lows cut, under the deeper chorus, with a reverb climbing an octave over it.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { lowCut: 2, cutoff: 4000, attack: 1.8, release: 5, volume: -13 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 10, shimmer: 0.45, mix: 0.4 },
      },
    ],
  },
  {
    id: 'concourse-ground-floor',
    name: 'Ground floor',
    category: 'pad',
    description:
      'Square wave and full sub octave with the filter low, doubled an octave below by a half-speed copy.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 700, resonance: 0.2, attack: 1.5, release: 5, volume: -12 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'concourse-departure-board',
    name: 'Departure board',
    category: 'keys',
    description:
      'Short soft notes from the chorus polysynth, kept going by a long tape delay and a plate.',
    instrument: {
      deviceId: 'dusk',
      params: {
        sub: 0.2,
        lowCut: 1,
        cutoff: 1300,
        resonance: 0.2,
        envelope: 0.35,
        attack: 0.04,
        release: 1.5,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1500,
          feedback: 0.6,
          wow: 0.3,
          drive: 0.2,
          highCut: 3500,
          spread: 0.5,
          mix: 0.4,
        },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },

  // Ember: one plain synthesiser voice and what two tape machines do with it.
  {
    id: 'concourse-two-machines',
    name: 'Two machines',
    category: 'pad',
    description:
      'A plain flute-like synthesiser tone through an equaliser into a long delay between two tape machines.',
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 2,
        osc2Shape: 3,
        osc2Coarse: 12,
        oscMix: 0.25,
        filterSlope: 0,
        cutoff: 1800,
        resonance: 0.1,
        keyTrack: 0.6,
        ampAttack: 0.25,
        ampDecay: 2,
        ampSustain: 0.8,
        ampRelease: 1.8,
        velToAmp: 0.4,
        lfo2Rate: 4.5,
        lfo2Amount: 0.003,
        volume: -1,
      },
    },
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Layer',
        params: { lowCut: 120, presence: -2, highCut: 6000 },
      },
      {
        deviceId: 'tape-echo',
        params: {
          time: 2000,
          feedback: 0.72,
          flutter: 0.1,
          drive: 0.25,
          highCut: 3800,
          mix: 0.45,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'concourse-slowed-synth-brass',
    name: 'Slowed synth brass',
    category: 'pad',
    description:
      'A soft brassy synthesiser phrase recorded and slowed to half speed: an octave down, in a long plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        osc2Fine: 6,
        subLevel: 0,
        cutoff: 900,
        resonance: 0.15,
        filterEnvAmount: 0.4,
        filterAttack: 0.6,
        filterDecay: 1.5,
        filterSustain: 0.5,
        filterRelease: 1.5,
        ampAttack: 0.3,
        ampDecay: 1.5,
        ampSustain: 0.8,
        ampRelease: 1.5,
        unisonVoices: 1,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 3600, highCut: 5000, spread: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },

  // Aurora: soft brass and a high string layer.
  {
    id: 'concourse-dim-brass-chord',
    name: 'Dim brass chord',
    category: 'pad',
    description:
      'A dark brassy chord that speaks over two seconds and keeps swelling while held, in a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: {
        brilliance: 700,
        lowCut: 120,
        resonance: 0.3,
        contour: 0.4,
        attack: 2,
        swell: 0.7,
        release: 5,
        detune: 7,
        volume: -15.5,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-mezzanine-strings',
    name: 'Mezzanine strings',
    category: 'pad',
    description:
      'A thin high string layer with its lows cut, for the top of a chord, in a slow chorus and a long room.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: {
        brilliance: 4000,
        lowCut: 450,
        attack: 1.5,
        release: 5,
        detune: 12,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'chorus',
        preset: 'Deep sea',
        params: {
          rate: 0.1,
          depth: 50,
          delayMs: 22,
          spread: 100,
          feedback: 0,
          hpHz: 120,
          mix: 0.3,
        },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10, mix: 0.3, width: 0.8 } },
    ],
  },

  // String machine: the ensemble, low and slow or only its top octave.
  {
    id: 'concourse-slow-ensemble',
    name: 'Slow ensemble',
    category: 'string',
    description: 'A seventies string ensemble, slow and dark, turning in a slow phaser in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 3, tone: 1600, speed: 0.6, volume: -6.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-thin-high-ensemble',
    name: 'Thin high ensemble',
    category: 'string',
    description:
      'The top octave of a string ensemble alone, thin and high, softened by tape in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: {
        attack: 1.5,
        release: 5,
        tone: 5000,
        ensemble: 0.8,
        speed: 1,
        drift: 0.3,
        width: 0.6,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { tone: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // Drone: what the building does when it is left alone.
  {
    id: 'concourse-night-shift-drone',
    name: 'Night shift drone',
    category: 'drone',
    description:
      'A low fifth whose partials wander slowly in pitch and place, darkened by tape in a long room.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.5,
        wave: 0.15,
        movement: 0.6,
        rate: 0.05,
        sub: 0.4,
        air: 0.1,
        cutoff: 900,
        attack: 4,
        release: 9,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3, hiss: 0.15 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 4000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'concourse-overtones-in-turn',
    name: 'Overtones in turn',
    category: 'drone',
    description:
      'A harmonic series over one low note with tuned air in it, each partial coming and going by itself.',
    instrument: {
      deviceId: 'drone',
      params: {
        shape: 3,
        partials: 0.8,
        wave: 0.1,
        movement: 0.8,
        rate: 0.1,
        sub: 0.2,
        air: 0.5,
        cutoff: 4000,
        release: 8,
        width: 0.8,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Reed organ: flutes in a rotor, reeds that beat.
  {
    id: 'concourse-turning-flutes',
    name: 'Turning flutes',
    category: 'organ',
    description:
      'Soft flute stops through a slowly rotating speaker, the chord turning gently in a long plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: {
        sub: 0.4,
        octave: 0.3,
        fifteenth: 0.05,
        breath: 0.25,
        attack: 0.3,
        release: 1.5,
        tone: 4000,
        volume: -12.5,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { hornDepth: 0.7, drive: 0.1, distance: 0.4, spread: 0.9 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-beating-reeds',
    name: 'Beating reeds',
    category: 'organ',
    description:
      'A reed organ with a second rank beating against the first, slow to speak, worn by tape in a long room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: {
        sub: 0.6,
        octave: 0.2,
        reed: 0.25,
        celeste: 0.8,
        bellows: 0.4,
        attack: 2.5,
        release: 5,
        tone: 1500,
        volume: -14.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, age: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, highCut: 4500, mix: 0.3 },
      },
    ],
  },

  // Horns: a breathy trumpet with its fifth, and low brass that takes its time.
  {
    id: 'concourse-breath-trumpet',
    name: 'Breath trumpet',
    category: 'wind',
    description:
      'A breathy trumpet with a second voice a fifth above, with tape echoes in a wide open space.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: {
        blow: 0.2,
        breath: 0.8,
        attack: 0.3,
        release: 1.8,
        vibrato: 0.1,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 900,
          feedback: 0.45,
          heads: 1,
          wow: 0.3,
          drive: 0.25,
          highCut: 3200,
          spread: 0.6,
          mix: 0.3,
        },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, highCut: 4500, mix: 0.35 },
      },
    ],
  },
  {
    id: 'concourse-slow-low-brass',
    name: 'Slow low brass',
    category: 'wind',
    description:
      'Low brass with a four-second swell on every note, held as a chord on tape in a long hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.35, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // Flute: a low flute on a loop, and flutes that are mostly air.
  {
    id: 'concourse-low-flute-loop',
    name: 'Low flute loop',
    category: 'wind',
    description:
      'A low flute with little vibrato on a four-second tape loop, each layer fainter than the one before.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: {
        blow: 0.3,
        chiff: 0.1,
        attack: 0.4,
        release: 2.5,
        vibrato: 0.1,
        scoop: 5,
        volume: -9,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4.4, feedback: 0.65, wear: 0.35, spread: 0.5, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-air-and-octave',
    name: 'Air and octave',
    category: 'wind',
    description:
      'Low flutes blown so softly they are mostly air, held as a chord with an octave halo behind.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.9, blow: 0.2, attack: 2, release: 4, vibrato: 0.1, volume: -17 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 9, shimmer: 0.35, tone: 5000, mix: 0.35 },
      },
    ],
    preview: 'chord',
  },

  // Clarinet: a line that comes back, a chord from nothing.
  {
    id: 'concourse-reed-and-return',
    name: 'Reed and return',
    category: 'wind',
    description:
      'A soft clarinet line, panned slowly, into a long tape delay: each phrase still sounds when the next begins.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.5, breath: 0.5, attack: 0.35, release: 1.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.5 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 1800,
          feedback: 0.68,
          wow: 0.3,
          flutter: 0.1,
          drive: 0.2,
          highCut: 3500,
          spread: 0.4,
          mix: 0.42,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-reeds-from-nothing',
    name: 'Reeds from nothing',
    category: 'wind',
    description:
      'Clarinets that start from nothing and go back to it, held as a chord in a softly singing hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.05, blow: 0.45, breath: 0.4, attack: 2.5, release: 3.5, volume: -11 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 6, mix: 0.35 } }],
    preview: 'chord',
  },

  // Bow: a string held without a pick, a low string bowed plainly.
  {
    id: 'concourse-held-string-loop',
    name: 'Held string loop',
    category: 'string',
    description:
      'One string held singing with no pick heard, layered on a long tape loop until the notes stack into a chord.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 2,
        release: 3,
        brightness: 0.45,
        decay: 12,
        vibrato: 0.1,
        detune: 5,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { length: 5.5, feedback: 0.78, wear: 0.3, mix: 0.45 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'concourse-rough-low-string',
    name: 'Rough low string',
    category: 'string',
    description:
      'A low string bowed without vibrato, a little rough at the bow, on tape in a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 1.2,
        release: 2.5,
        brightness: 0.35,
        pressure: 0.6,
        vibrato: 0,
        detune: 3,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.5, mix: 0.3 } },
    ],
    preview: 'low',
  },

  // Chamber strings: a few players, no vibrato, a long way off.
  {
    id: 'concourse-staggered-strings',
    name: 'Staggered strings',
    category: 'string',
    description:
      'A small section without vibrato whose phrase returns from a tape loop at half speed and plays against itself.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        attack: 1.8,
        release: 3,
        bow: 0.3,
        vibrato: 0,
        mute: 0.3,
        scatter: 0.7,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { length: 3.2, feedback: 0.6, speed: 0, wear: 0.3, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-far-gate-mutes',
    name: 'Far gate mutes',
    category: 'string',
    description:
      'Six muted players swelling in over three seconds, heard from the far end of a long stone hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 6, attack: 3, release: 4, scatter: 0.5, width: 0.5, volume: -8 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { preDelay: 90, mix: 0.45 } }],
  },

  // Tape orchestra: strips of tape at half speed.
  {
    id: 'concourse-tape-choir-loop',
    name: 'Tape choir loop',
    category: 'voice',
    description:
      'A choir on strips of tape at half speed, laid again on a loop that never lines up with them.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        age: 0.35,
        speed: 1,
        attack: 0.8,
        release: 2.5,
        players: 0.7,
        vibrato: 0.2,
        tone: 0.1,
        volume: -9,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3.7, feedback: 0.65, wear: 0.4, spread: 0.5, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-slowed-tape-flutes',
    name: 'Slowed tape flutes',
    category: 'wind',
    description:
      'Tape flutes at half speed: breathy, a little unsteady, with murky repeats and a small plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        age: 0.45,
        speed: 1,
        attack: 0.05,
        release: 1,
        vibrato: 0.4,
        tone: 0.1,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 800, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },

  // Thesis: tuned air.
  {
    id: 'concourse-air-chord',
    name: 'Air chord',
    category: 'pad',
    description:
      'Noise filtered into narrow bands on a chord and its mirror image, each band swelling in turn.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 70, attack: 2, release: 5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Master', params: { ceiling: -9, gain: 4.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-long-corridor',
    name: 'Long corridor',
    category: 'texture',
    description:
      'Breathy noise with a faint chord in it, like wind finding the gaps in a long corridor.',
    instrument: {
      deviceId: 'thesis',
      params: {
        center: 60,
        resonance: 14,
        width: 60,
        attack: 1.5,
        release: 4,
        mode: 2,
        breatheRate: 0.2,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Master', params: { ceiling: -9, gain: -2.5 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.4 } },
    ],
  },

  // Ladder bass: the floor, and a line that slides.
  {
    id: 'concourse-soft-sub-tone',
    name: 'Soft sub tone',
    category: 'keys',
    description:
      'A soft sub tone with no edge to it, for the floor of a piece, warmed a little by tape.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { wave: 0.8, beat: 4, sub: 0.9, cutoff: 160, drive: 0.1, glide: 0.2, volume: -15 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, wow: 0.15, hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'concourse-sliding-bass',
    name: 'Sliding bass',
    category: 'keys',
    description:
      'A round bass line that slides from note to note, with a slow chorus and a dark tape echo.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: {
        wave: 0.4,
        beat: 4,
        sub: 0.4,
        cutoff: 500,
        emphasis: 0.2,
        contour: 0.2,
        decay: 8,
        drive: 0.15,
        glide: 0.35,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'chorus',
        preset: 'Subtle widener',
        params: { rate: 0.12, depth: 45, delayMs: 20, hpHz: 150, mix: 0.25 },
      },
      {
        deviceId: 'tape-echo',
        params: { time: 700, feedback: 0.4, wow: 0.3, highCut: 2400, mix: 0.25 },
      },
    ],
    preview: 'line',
  },

  // Acoustic guitar: slowed, or left to ring with something growing behind it.
  {
    id: 'concourse-slowed-nylon',
    name: 'Slowed nylon',
    category: 'plucked',
    description:
      'A nylon-string guitar played with the thumb and slowed to half speed on tape, in a long plate.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: {
        type: 1,
        body: 0.9,
        position: 0.32,
        nail: 0.1,
        sustain: 6,
        release: 3,
        strum: 30,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2800, mix: 0.8 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-steel-let-ring',
    name: 'Steel, let ring',
    category: 'plucked',
    description:
      'Steel strings left to ring, with a faint pad that swells in behind them and a soft octave halo.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { nail: 0.35, tone: 0.55, shimmer: 0.5, strum: 25, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'String pad',
        params: { rise: 1.5, fall: 6, brightness: 2800, mix: 0.4 },
      },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 8, shimmer: 0.3, mix: 0.3 },
      },
    ],
  },

  // Guitar: notes with no pick that circle, and clean notes with dark repeats.
  {
    id: 'concourse-circling-guitar',
    name: 'Circling guitar',
    category: 'plucked',
    description:
      'Guitar notes faded in so no pick is heard, circling in a long tape delay until they overlap.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: {
        pickup: 0.6,
        hardness: 0.35,
        sustain: 22,
        tone: 2800,
        swell: 1.2,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.04, output: 9 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 1900,
          feedback: 0.75,
          wow: 0.3,
          drive: 0.35,
          highCut: 3200,
          mix: 0.45,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'concourse-neck-pickup-echoes',
    name: 'Neck pickup echoes',
    category: 'plucked',
    description:
      'Clean neck-pickup notes with dark bucket-brigade repeats and a three-spring tank behind them.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 0.9,
        hardness: 0.45,
        sustain: 10,
        tone: 3200,
        strum: 10,
        warmth: 0.4,
        volume: 2.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 520, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },

  // Pedal steel: the volume pedal, the bar and an octave above.
  {
    id: 'concourse-thin-air-steel',
    name: 'Thin air steel',
    category: 'plucked',
    description:
      'Pedal steel swelled in with the volume pedal, hanging in a reverb that climbs an octave above it.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, sustain: 30, vibrato: 4, pick: 0.3, tone: 2400, volume: -8 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 12, shimmer: 0.5, tone: 5500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'concourse-slow-steel-slides',
    name: 'Slow steel slides',
    category: 'plucked',
    description:
      'A lap steel line with a slow bar vibrato, a three-head tape echo and a spring tank.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: {
        swell: 0.5,
        range: 5,
        glide: 400,
        vibrato: 8,
        rate: 3.5,
        pick: 0.45,
        tone: 3000,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 480,
          feedback: 0.5,
          heads: 2,
          wow: 0.3,
          flutter: 0.2,
          highCut: 3800,
          spread: 0.5,
          mix: 0.3,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Harp: soft plucks with strings that ring on behind.
  {
    id: 'concourse-atrium-harp',
    name: 'Atrium harp',
    category: 'plucked',
    description:
      'Harp strings plucked softly near the middle, with strings that learn the notes and ring on behind them.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.42, touch: 0.2, decay: 2.5, halo: 0.9, body: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 6, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7, mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-silk-string-loops',
    name: 'Silk string loops',
    category: 'plucked',
    description:
      'Soft silk strings with a small bend, repeating on a three-second tape loop and a longer drifting one.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { touch: 0.1, decay: 3, halo: 0.9, bend: 30, volume: 1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.1 } },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2.9, feedback: 0.6, wear: 0.4, spread: 0.6, mix: 0.5 },
      },
      { deviceId: 'micro-looper', preset: 'Drifting', params: { length: 4.9, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Chord harp: the strum plate, slowly.
  {
    id: 'concourse-strum-plate-sweep',
    name: 'Strum plate sweep',
    category: 'plucked',
    description:
      'A slow sweep across an electronic chord harp, with a reverb that climbs an octave after it.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: {
        strum: 120,
        direction: 0,
        span: 2,
        sustain: 5,
        tone: 0.4,
        pad: 0.2,
        spread: 0.7,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 9, shimmer: 0.4, mix: 0.35 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'concourse-pad-with-chimes',
    name: 'Pad with chimes',
    category: 'plucked',
    description:
      'The held pad of a chord harp with a few soft chimes over it, wobbling on a worn cassette in a room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 60, span: 1, sustain: 3, tone: 0.45, pad: 0.8, spread: 0.7, volume: -16.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.35, noise: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Zither: open strings, hammered or strummed, with something turning over them.
  {
    id: 'concourse-hammered-and-phased',
    name: 'Hammered and phased',
    category: 'plucked',
    description:
      'An open-tuned zither hammered in a soft roll, turning through a slow phaser into a hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        chord: 2,
        strum: 80,
        roll: 8,
        release: 5,
        brightness: 0.4,
        sympathy: 0.6,
        volume: -8.7,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'concourse-slow-open-strum',
    name: 'Slow open strum',
    category: 'plucked',
    description:
      'A slow strum across open strings under a wide flanger, the sympathetic strings ringing on in a large room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { strum: 420, roll: 0, sympathy: 0.5, body: 1, volume: -8.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { mix: 0.25 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10, mix: 0.35 } },
    ],
  },

  // Handpan: slowed and looped, or answered by its own memory.
  {
    id: 'concourse-slowed-handpan-loop',
    name: 'Slowed handpan loop',
    category: 'bell',
    description:
      'A handpan slowed to half speed and dulled by tape, each phrase kept turning on a four-second loop.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: {
        decay: 4.5,
        touch: 0.2,
        position: 0.4,
        shimmer: 0.5,
        sympathy: 0.6,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 2600, highCut: 4500 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, tone: 0.35 } },
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4.1, feedback: 0.65, wear: 0.5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'concourse-tongue-drum-memory',
    name: 'Tongue drum memory',
    category: 'bell',
    description:
      'A steel tongue drum struck softly, with an echo that returns earlier notes, some backwards, in a long hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 6, volume: -3 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Backwards', params: { time: 900, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // Mallets: a rolled murmur, and a celesta whose notes are caught and held.
  {
    id: 'concourse-marimba-murmur',
    name: 'Marimba murmur',
    category: 'bell',
    description:
      'A softly rolled marimba chord, a low murmur to put under other things, on tape in a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.15, roll: 9, volume: -17 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'concourse-celesta-held',
    name: 'Celesta held',
    category: 'bell',
    description:
      'A celesta struck softly, each note caught and held on as a faint even tone, in a long hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.25, decay: 1.5, damper: 0.4, width: 0.3, volume: -10 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Sustain pedal',
        params: { sensitivity: 0.75, decay: 20, mix: 0.55 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 7, mix: 0.3 } },
    ],
  },

  // Atmosphere: the building's own sounds.
  {
    id: 'concourse-vent-air',
    name: 'Vent air',
    category: 'texture',
    description:
      'Steady air from the vents of a large building, with very little movement and no weather in it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.5,
        movement: 0.15,
        tone: 0.4,
        resonance: 0.1,
        size: 0.5,
        attack: 3,
        release: 6,
        width: 0.7,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 2500, lfoAmount: 15, lfoRateHz: 0.05 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-tube-lights',
    name: 'Tube lights',
    category: 'texture',
    description:
      'The hum of light fittings, tuned to the key you hold, thickened by tape in a short room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: {
        density: 0.55,
        movement: 0.3,
        tone: 0.45,
        resonance: 0.3,
        size: 0.3,
        attack: 1.5,
        release: 4,
        width: 0.5,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // Outdoors: what is heard when a door is left open.
  {
    id: 'concourse-chimes-by-chance',
    name: 'Chimes by chance',
    category: 'texture',
    description:
      'Wind chimes rung by chance, never the same pattern twice, caught on a slow loop in a long room.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.35, distance: 0.45, movement: 0.9, tone: 0.5, volume: -3 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { length: 7.3, feedback: 0.6, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10, mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-beyond-the-runway',
    name: 'Beyond the runway',
    category: 'texture',
    description:
      'Crickets in the grass beyond the runway, far off, steady and high, as heard through an open door.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: { density: 0.8, distance: 0.7, movement: 0.6, tone: 0.15, volume: 3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Sampler: whatever is loaded, handled like tape.
  {
    id: 'concourse-loaded-octave-down',
    name: 'Loaded, octave down',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down on an unsteady loop and layered again on a longer one.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.2, release: 3.5, tone: 3800, wobble: 0.45, volume: -15.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { length: 6.1, feedback: 0.65, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-loaded-backwards',
    name: 'Loaded, backwards',
    category: 'keys',
    description:
      'Whatever is loaded, played backwards once per key, with a long tape delay and a plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { release: 1.5, tone: 7000, wobble: 0.25, volume: -13 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1600,
          feedback: 0.55,
          wow: 0.3,
          highCut: 3500,
          spread: 0.5,
          mix: 0.35,
        },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // Grain: whatever is loaded, held still or stretched.
  {
    id: 'concourse-one-moment-layered',
    name: 'One moment, layered',
    category: 'pad',
    description:
      'Whatever is loaded, held at one moment as a soft cloud and layered on a slow tape loop.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        position: 0.4,
        size: 500,
        spray: 0.1,
        detune: 4,
        attack: 2,
        release: 5,
        spread: 0.6,
        tone: 6000,
        volume: -17.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4.8, feedback: 0.65, wear: 0.35, spread: 0.5, mix: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10, mix: 0.3 } },
    ],
  },
  {
    id: 'concourse-long-stretch',
    name: 'Long stretch',
    category: 'pad',
    description:
      'Whatever is loaded, stretched to many times its length with some grains an octave away, under an octave halo.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: {
        position: 0.1,
        scan: 0.03,
        size: 600,
        spray: 0.2,
        detune: 6,
        octaves: 0.3,
        reverse: 0.2,
        attack: 2,
        release: 6,
        tone: 9000,
        volume: -14.5,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 10, shimmer: 0.35, mix: 0.3 },
      },
    ],
  },

  // Tanpura: drone strings, plain or buzzing, a long way off.
  {
    id: 'concourse-plain-drone-strings',
    name: 'Plain drone strings',
    category: 'drone',
    description:
      'Four drone strings with the buzz taken off the bridge, smeared until the plucks are hard to find.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: {
        jawari: 0.15,
        speed: 7,
        decay: 25,
        detune: 3,
        body: 0.5,
        spread: 0.4,
        volume: -9.6,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.35, mix: 0.85 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, mix: 0.3, width: 0.7 } },
    ],
  },
  {
    id: 'concourse-buzzing-drone-lute',
    name: 'Buzzing drone lute',
    category: 'drone',
    description:
      'A buzzing drone lute plucked slowly, each sweep of overtones heard down a long hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.7, speed: 9, decay: 25, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3, hiss: 0.15 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // West coast: struck tones left to chance, and one that folds.
  {
    id: 'concourse-chance-mallets',
    name: 'Chance mallets',
    category: 'bell',
    description:
      'Soft folded mallet tones, each one differing by chance in colour, length and place, with dotted tape echoes.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: {
        fold: 0.2,
        fm: 0.08,
        timbreEnv: 0.3,
        decay: 2.2,
        colour: 0.45,
        chance: 0.6,
        drift: 0.3,
        volume: -1,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 1300,
          feedback: 0.5,
          heads: 3,
          wow: 0.3,
          highCut: 3500,
          spread: 0.6,
          mix: 0.3,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'concourse-slowly-folding-tone',
    name: 'Slowly folding tone',
    category: 'drone',
    description:
      'A pure tone that slowly folds over into richer ones and back, held low in a vast room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.55, symmetry: 0.3, attack: 3, decay: 5, colour: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 5000, mix: 0.35 },
      },
    ],
  },
]
