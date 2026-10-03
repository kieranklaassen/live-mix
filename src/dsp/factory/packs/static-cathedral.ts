import { type FactoryPreset } from '../types'

// Static Cathedral: organ, piano, guitar, voices and winds pushed through drive, bit reduction,
// starved streams, pitch warp and blur, then re-recorded from the far end of a stone building.

export const PRESETS: readonly FactoryPreset[] = [
  // Organ: the centre of the pack. Pipes and reeds, overdriven, re-amped and worn down.
  {
    id: 'static-cathedral-nave-wall',
    name: 'Nave wall',
    category: 'organ',
    description:
      'Full organ bitten by a pentode stage, played through a stack and recorded again from the far end of a stone nave.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { attack: 0.3, release: 2, tone: 5200, volume: -14 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.7, highCut: 7000, output: -6 },
      },
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { speaker: 2, drive: 0.4, room: 0.65, output: -1 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-loft-in-static',
    name: 'Loft in static',
    category: 'organ',
    description:
      'Far pipes that take three seconds to speak, swirled by a starved stream, with radio static that rises as they do.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { breath: 0.4, bellows: 0.5, tone: 1600, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Behind glass',
        params: { loss: 0.6, smear: 0.3, highCut: 6000 },
      },
      {
        deviceId: 'noise-floor',
        preset: 'Radio static',
        params: { level: -44, follow: 0.7, response: 0.8 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, decay: 12 } },
    ],
  },
  {
    id: 'static-cathedral-clipped-flutes',
    name: 'Clipped flutes',
    category: 'organ',
    description:
      'Stopped flute pipes pushed into a hard clip until the chord fuses into one buzzing tone, then rolled off in a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { octave: 0.6, fifteenth: 0.25, attack: 0.05, release: 1.2, volume: -8 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Hard clip master',
        params: { driveDb: 26, toneDb: -4, outputDb: -24 },
      },
      {
        deviceId: 'ambient-eq',
        preset: 'Shaded',
        params: { low: -2, body: -2, presence: -2, highCut: 5000 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35, decay: 5 } },
    ],
  },
  {
    id: 'static-cathedral-eight-bit-bellows',
    name: 'Eight bit bellows',
    category: 'organ',
    description:
      'A reedy pump organ with a heaving bellows, sampled at eight bits and played through a small speaker in a side room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { bellows: 1, breath: 0.6, celeste: 0.35, volume: -10 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { rate: 6000 } },
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { room: 0.4, distance: 0.45, output: -6 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'static-cathedral-pedal-undertow',
    name: 'Pedal undertow',
    category: 'drone',
    description:
      'A low pedal of two ranks beating against each other, thickened by a driven transformer in a long stone tail.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { sub: 1, octave: 0.2, reed: 0.3, attack: 2.5, release: 5, tone: 1400, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.65, output: -5.5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4, lowDecay: 8 } },
    ],
  },
  {
    id: 'static-cathedral-smeared-voluntary',
    name: 'Smeared voluntary',
    category: 'organ',
    description:
      'Organ chords whose spectrum hangs on after the keys lift, drifting off pitch into a reverb that adds a fifth and octave.',
    instrument: {
      deviceId: 'organ',
      params: { reed: 0.45, octave: 0.6, attack: 0.05, release: 0.3, tone: 4000, volume: -17 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Endless',
        params: { blur: 0.95, width: 0.5, mix: 0.8 },
      },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 0.8, width: 0.3 } },
      { deviceId: 'shimmer', preset: 'Organ loft', params: { width: 0.6, mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-skipping-tremulant',
    name: 'Skipping tremulant',
    category: 'organ',
    description:
      'One flute rank with its tremulant shaking, skipping like a scratched disc through a worn converter into a long plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { octave: 0.35, tremulant: 0.8, release: 0.8, volume: -11.5 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Skipping disc',
        params: { time: 120, chance: 0.4, calm: 0.4, spread: 0.3 },
      },
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-warped-mixture',
    name: 'Warped mixture',
    category: 'organ',
    description:
      'A mixture of upper ranks bent slowly out of tune as if on a warped disc, through a horn speaker far down a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 0.2,
        octave: 0.6,
        twelfth: 0.8,
        fifteenth: 0.9,
        reed: 0.2,
        attack: 0.6,
        release: 3,
        tone: 8000,
        volume: -16,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.1, surface: 0.1, pops: 0 } },
      {
        deviceId: 're-amp',
        preset: 'Station platform',
        params: { distance: 0.8, room: 0.4, output: 1 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, mix: 0.3 } },
    ],
  },

  // Felt piano: detuned, crushed, restruck, turned backwards.
  {
    id: 'static-cathedral-detuned-upright',
    name: 'Detuned upright',
    category: 'keys',
    description:
      'An upright with its unisons pulled wide apart, through twelve-bit converters at a low sample rate and into a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        detune: 1,
        hardness: 0.3,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -14,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 11000, jitter: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'static-cathedral-piano-under-snow',
    name: 'Piano under snow',
    category: 'keys',
    description:
      'The softest hammers dissolved by long grains and a blurred spectrum until only the chord is left, under tape hiss.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 1,
        hardness: 0.15,
        thump: 0.3,
        action: 0.2,
        pedalNoise: 0,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -14,
      },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Slow smear',
        params: { feedback: 0.55, spread: 0.4, mix: 0.85 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { highCut: 6000, width: 0.5, mix: 0.6 },
      },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.6, mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-restruck-hammers',
    name: 'Restruck hammers',
    category: 'keys',
    description:
      'A bare, hard piano whose every note is restruck in a fast even pulse through a hot console, close in a small wooden room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.8,
        thump: 0.5,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Restruck',
        params: { time: 170, repeats: 12, decay: 0.12, high: 0, shape: 0.1, spread: 0.5, mix: 0.6 },
      },
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'static-cathedral-unwound-upright',
    name: 'Unwound upright',
    category: 'keys',
    description:
      'A felt piano whose echoes slide down an octave as they repeat, printed hot to tape and left in a damped plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.8,
        detune: 0.7,
        grit: 0.3,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Falling tape',
        params: { time: 620, feedback: 0.7, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Hot glue', params: { wow: 0.3, age: 0.3, output: -4.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-crushed-felt',
    name: 'Crushed felt',
    category: 'keys',
    description:
      'A close felt piano crushed by a pushed console stage and played back through a small amplifier with its dark spring.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        hardness: 0.45,
        thump: 0.8,
        grit: 0.5,
        resonance: 0.3,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -10,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { drive: 0.5, mix: 0.85 } },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.45, distance: 0.5, room: 0.6, output: -9 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'static-cathedral-backwards-vestry',
    name: 'Backwards vestry',
    category: 'keys',
    description:
      'Piano notes turned backwards into slow swells, thinned as if by a starved stream, in a dark reverb that rises in reverse.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Hall',
      params: {
        hardness: 0.5,
        thump: 0.2,
        action: 0.2,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -10,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1400, feedback: 0.35, mix: 0.9 },
      },
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { highCut: 5000 } },
      {
        deviceId: 'shaped-reverb',
        params: {
          shape: 1,
          time: 3,
          density: 1,
          preDelay: 60,
          colour: -0.8,
          highCut: 3500,
          lowCut: 200,
          modulation: 0.6,
          tail: 0.7,
          width: 0.7,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'static-cathedral-hammer-residue',
    name: 'Hammer residue',
    category: 'keys',
    description:
      'Only what a low-bitrate stream throws away of a bare piano: the thin remainder of each strike, in a plain hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.7, resonance: 0, reverbMix: 0, polyphony: 12, outputDb: -4 },
    },
    effects: [
      { deviceId: 'low-bitrate', params: { loss: 0.6, mode: 1 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 10, outputDb: -17 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 5, mix: 0.4 } },
    ],
  },

  // Guitar: fuzz walls, skipping buffers, radio links.
  {
    id: 'static-cathedral-nave-fuzz',
    name: 'Nave fuzz',
    category: 'plucked',
    description:
      'An open chord through a hard fuzz, its spectrum smeared until the strum is gone and a wide grain is left in the nave.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { pickup: 0.3, hardness: 0.7, sustain: 20, volume: -6 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Fuzz pedal',
        params: { driveDb: 32, toneDb: 2, outputDb: -24 },
      },
      { deviceId: 'ambient-eq', params: { low: -1.5, body: -1.5, presence: -1.5, air: -1.5 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { highCut: 6000, width: 0.3, mix: 0.75 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-skipping-string',
    name: 'Skipping string',
    category: 'plucked',
    description:
      'Clean neck-pickup notes that skip and repeat like a scratched disc, with backwards grains of themselves behind.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.7, sustain: 6, shimmer: 0, volume: -2 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Skipping disc',
        params: { time: 110, chance: 0.45, repeat: 0.5, calm: 0.3 },
      },
      {
        deviceId: 'grain-delay',
        params: {
          time: 420,
          spray: 0.2,
          pitch: 0,
          pitchSpray: 0.03,
          size: 260,
          density: 3,
          reverse: 1,
          feedback: 0.35,
          tone: 8000,
          spread: 0.8,
          mix: 0.3,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-medium-wave-guitar',
    name: 'Medium wave guitar',
    category: 'plucked',
    description:
      'Swelled guitar chords sent over medium wave, the static rising whenever the signal sinks, in open space.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1.5, tone: 2400, warmth: 0.7, volume: 6 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Storm coming',
        params: { fading: 0.6, static: 0.5, mix: 0.75 },
      },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: 7.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-baritone-grind',
    name: 'Baritone grind',
    category: 'plucked',
    description:
      'Low strings picked hard into a dark triode fuzz and a warm stack, the microphone turned away from the cone.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { sustain: 20, volume: -4 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { drive: 0.6 } },
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { angle: 0.8, distance: 0.35, output: -5 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25, width: 0.5 } },
    ],
    preview: 'low',
  },
  {
    id: 'static-cathedral-five-bit-twelve',
    name: 'Five bit twelve',
    category: 'plucked',
    description:
      'A twelve-string strum reduced to five bits and low-passed, so it arrives as a soft crackling chord in a plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { sustain: 18, strum: 55, volume: -0.8 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed', params: { drive: 6, rate: 14000 } },
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 2600, slope: 1 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-held-and-spiralling',
    name: 'Held and spiralling',
    category: 'plucked',
    description:
      'Each picked note is caught and held as a tone, then set slowly spiralling upward by a frequency shifter.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.6, hardness: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Glass organ', params: { decay: 30, mix: 0.7 } },
      { deviceId: 'freq-shifter', preset: 'Barber pole', params: { feedback: 0.75, mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-octave-down-guitar-loop',
    name: 'Octave-down guitar loop',
    category: 'plucked',
    description:
      'Picked notes replayed an octave down at half speed in long overlapping cycles, tape-saturated in a breathing hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { pickup: 0.7, hardness: 0.5, sustain: 20, strum: 0, volume: -4 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag', params: { length: 3000, mix: 0.8 } },
      { deviceId: 'tape', preset: 'Hot glue', params: { speed: 1, output: -2 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },

  // Choir: voices shifted, starved and sent over bad links.
  {
    id: 'static-cathedral-wire-choir',
    name: 'Wire choir',
    category: 'voice',
    description:
      'An open ah with two wavering copies a fifth above and a fourth below, its phases scattered by a failing stream.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 1.4, release: 4, volume: -10.5 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Broken choir', params: { mix: 0.35 } },
      { deviceId: 'low-bitrate', preset: 'Smeared haze', params: { loss: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'static-cathedral-treble-images',
    name: 'Treble images',
    category: 'voice',
    description:
      'High treble voices on ooh with converter images mirrored above them, in a reverb that climbs an octave.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.9, release: 3.5, volume: -10 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy', params: { rate: 7000 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-far-hall-monks',
    name: 'Far hall monks',
    category: 'voice',
    description:
      'Bass voices on a closed oh, heavy and dull, played through a loudspeaker and heard from the far end of a hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { breath: 0.25, attack: 2.2, release: 6, volume: -6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.7 } },
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { speaker: 4, room: 0.7, output: -13 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'static-cathedral-breath-and-dropouts',
    name: 'Breath and dropouts',
    category: 'voice',
    description:
      'A whispered chord, more air than tone, that drops out and stutters like a bad connection in a very large space.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { motion: 0.85, width: 0.7, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Bad connection',
        params: { dropouts: 0.45, stutter: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'static-cathedral-sideband-psalm',
    name: 'Sideband psalm',
    category: 'voice',
    description:
      'A slowly changing vowel sung over a sideband link tuned a little wrong, so every voice comes back off its pitch.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { ensemble: 1, vibrato: 0, attack: 1.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Sideband voices', params: { tuning: 0.15, mix: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.4 } },
    ],
  },
  {
    id: 'static-cathedral-lone-cantor',
    name: 'Lone cantor',
    category: 'voice',
    description:
      'One singer with a light vibrato, shadowed by stumbling octave copies of the line, in a hall that sings back.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.3, release: 1.5, vibrato: 18, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'glitch',
        params: {
          time: 500,
          chance: 0.3,
          repeat: 0.8,
          skip: 0.3,
          reverse: 0.4,
          slow: 0,
          calm: 0.85,
          decay: 0.5,
          octaves: 0.8,
          spread: 0.6,
          mix: 0.5,
        },
      },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'line',
  },

  // Drone: walls of grain with a chord inside.
  {
    id: 'static-cathedral-wall-of-grain',
    name: 'Wall of grain',
    category: 'drone',
    description:
      'A just minor chord of wandering partials folded over itself by a broken-speaker distortion and rolled off to a dark roar.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { wave: 0.6, movement: 0.8, attack: 3, cutoff: 2000, volume: -10 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Blown speaker',
        params: { driveDb: 28, toneDb: -6, outputDb: -23.5, mix: 0.8 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 4000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-breaking-speaker-drone',
    name: 'Breaking speaker drone',
    category: 'drone',
    description:
      'Low octaves over a heavy sub through a speaker on the edge of breaking up, with the hum of an amplifier left on.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { movement: 0.4, air: 0.1, attack: 2.5, cutoff: 900, volume: -8 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -38 } },
      {
        deviceId: 're-amp',
        preset: 'Speaker on the edge',
        params: { speaker: 2, distance: 0.3, output: -5 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-folded-series',
    name: 'Folded series',
    category: 'drone',
    description:
      'A buzzing harmonic series aliased at a low sample rate until folded partials ring between the real ones, then blurred.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { wave: 0.9, cutoff: 5000, attack: 2, volume: -7.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Metallic', params: { rate: 5000 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-flickering-major',
    name: 'Flickering major',
    category: 'drone',
    description:
      'A just major chord of which a starved stream keeps only the few strongest partials, flickering in a tail that blooms up a fifth.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { partials: 1, movement: 0.9, rate: 0.2, attack: 2.5, volume: -6.1 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Few partials', params: { stereo: 0.8 } },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { width: 0.5, mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'static-cathedral-sinking-fifths',
    name: 'Sinking fifths',
    category: 'drone',
    description:
      'Open fifths in a slowly falling spiral of shifted feedback, grains an octave down beneath and a tail that drifts lower.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { wave: 0.35, sub: 0.5, attack: 2, volume: -10 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Falling spiral', params: { width: 0.4, mix: 0.5 } },
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { spread: 0.3, mix: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { width: 0.4, mix: 0.45 } },
    ],
  },
  {
    id: 'static-cathedral-between-two-stations',
    name: 'Between two stations',
    category: 'drone',
    description:
      'A cluster of close sines heard between two shortwave stations, fading under static and whistles with murky repeats behind.',
    instrument: {
      deviceId: 'drone',
      params: {
        shape: 6,
        partials: 0.85,
        wave: 0,
        movement: 1,
        rate: 0.12,
        sub: 0,
        air: 0.5,
        cutoff: 1600,
        attack: 2.5,
        release: 12,
        width: 1,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Between stations', params: { tuning: -0.45, mix: 0.65 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },

  // Horns: brass and winds made distant, driven and broken up.
  {
    id: 'static-cathedral-brass-through-stone',
    name: 'Brass through stone',
    category: 'wind',
    description:
      'Trombones and tuba four to a note, tape-saturated and recorded again from a far room, heavy and without edge.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.75, breath: 0.15, attack: 2, release: 5, volume: -4.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.75, hiss: 0 } },
      {
        deviceId: 're-amp',
        preset: 'Just the room',
        params: { distance: 0.9, room: 0.8, output: -6 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'static-cathedral-overdriven-horns',
    name: 'Overdriven horns',
    category: 'wind',
    description:
      'French horns swelling into a pushed triode until they compress, their edges smeared into one dense band.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.8, section: 1, attack: 1.8, volume: -8 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Triode glow',
        params: { drive: 0.75, push: 1, output: -9.5 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.5, mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.6, mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-telephone-trumpet',
    name: 'Telephone trumpet',
    category: 'wind',
    description:
      'A thin muted trumpet through eight-bit mu-law converters, with dark tape echoes trailing into a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { breath: 0.35, vibrato: 0.3, release: 1.4, volume: -0.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Phone' },
      { deviceId: 'tape-echo', params: { time: 520, feedback: 0.5, highCut: 2800, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-flugel-under-water',
    name: 'Flugel under water',
    category: 'wind',
    description:
      'A breathy flugelhorn heard as if under water, with its own phrases returning backwards behind it in a plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { breath: 0.65, attack: 0.4, release: 2, volume: -3 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater' },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 900, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-band-winding-down',
    name: 'Band winding down',
    category: 'wind',
    description:
      'A full trumpet section that keeps slowing to a stop and starting again, on a record with a slow warp and crackle.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.75, attack: 0.4, release: 1.2, volume: -8.5 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Winding down', params: { chance: 0.5, time: 900 } },
      { deviceId: 'vinyl', preset: 'Slow platter', params: { crackle: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 8, mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-cavern-fifths',
    name: 'Cavern fifths',
    category: 'wind',
    description:
      'A soft trumpet shadowed a fifth above and doubled an octave up and down, in a dark cavern of short echoes.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: { attack: 0.4, release: 2, volume: -3 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octaves both' },
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.6, output: -3.5 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
    ],
  },

  // Wavetable: the digital synth under the wall, pulsed, folded and shifted.
  {
    id: 'static-cathedral-converter-choir',
    name: 'Converter choir',
    category: 'pad',
    description:
      'A slow vowel wavetable through a nine-bit converter with a jittering clock, in a long hall that sings back.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { position: 0.35, motion: 1, rate: 0.08, attack: 2, volume: -10.8 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { width: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'static-cathedral-signal-lamp',
    name: 'Signal lamp',
    category: 'pad',
    description:
      'One plain reed tone chopped into an even pulse like a signal lamp, with dark repeats smearing the gaps.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { motion: 0, attack: 0.02, release: 0.4, cutoff: 3000, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 5.5, smooth: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 545, feedback: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'static-cathedral-folded-cloud',
    name: 'Folded cloud',
    category: 'pad',
    description:
      'A slowly morphing table of partials wavefolded into dense upper grit and rolled off again, slow to arrive in open space.',
    instrument: {
      deviceId: 'wavetable',
      params: {
        table: 4,
        position: 0.5,
        motion: 1,
        rate: 0.03,
        detune: 18,
        sub: 0.2,
        cutoff: 9000,
        resonance: 0,
        attack: 3,
        release: 8,
        spread: 0.5,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Wavefold lead',
        params: { driveDb: 18, toneDb: 0, outputDb: -19 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'static-cathedral-dull-metal-pad',
    name: 'Dull metal pad',
    category: 'pad',
    description:
      'A hollow table with every partial moved up by the same forty-three hertz, so the chord turns to dull metal.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { motion: 0.9, resonance: 0.45, attack: 2, volume: -8.8 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Bell metal',
        params: { shift: 43, feedback: 0.4, mix: 0.6 },
      },
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-frozen-frame-glass',
    name: 'Frozen frame glass',
    category: 'pad',
    description:
      'A glass table bitten by a pushed pentode and held frame by frame by a stream that cannot keep up.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { position: 0.7, motion: 0.2, detune: 16, attack: 0.4, release: 5, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { push: 1, drive: 0.5, output: -5.5 } },
      { deviceId: 'low-bitrate', preset: 'Frozen stream' },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-growling-reeds',
    name: 'Growling reeds',
    category: 'pad',
    description:
      'A table moving from reed to sawtooth through an overdriven rotating speaker, recorded again from across a room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.5,
        motion: 0.8,
        rate: 0.08,
        attack: 0.6,
        release: 2.5,
        cutoff: 5000,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Growl', params: { speed: 0 } },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { distance: 0.6, room: 0.7, output: -5 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },

  // Acoustic guitar: wood on an early sampler.
  {
    id: 'static-cathedral-transept-nylon',
    name: 'Transept nylon',
    category: 'plucked',
    description:
      'Nylon strings with reversed grains of themselves behind each note, glazed by a sixteen kilohertz converter in a hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { body: 1, nail: 0.05, release: 4, strum: 35, volume: 2.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { spread: 0.4, mix: 0.45 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-slipping-steel',
    name: 'Slipping steel',
    category: 'plucked',
    description:
      'Ringing steel strings on an early sampler that now and then slips, repeats a slice or runs it backwards.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { position: 0.1, nail: 0.8, shimmer: 0.9, volume: 0 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Rare slips', params: { chance: 0.2 } },
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // Atmosphere: the noise itself, tuned or crushed.
  {
    id: 'static-cathedral-tuned-mains',
    name: 'Tuned mains',
    category: 'texture',
    description:
      'Mains hum tuned to the key, overdriven by a tube stage through a stack and left to fill a stone room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.6, movement: 0.7, resonance: 0.45, attack: 1.5, release: 4, volume: -6 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 16, outputDb: -21.5 } },
      { deviceId: 're-amp', preset: 'Warm stack', params: { distance: 0.6, room: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-six-bit-rain',
    name: 'Six bit rain',
    category: 'texture',
    description:
      'A downpour squashed flat and crushed to six bits at a low sample rate, until it is a sheet of static under a wide roof.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { tone: 0.5, attack: 1.5, volume: 0 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Hard clip master',
        params: { driveDb: 24, outputDb: -16.5 },
      },
      { deviceId: 'vintage-digital', preset: 'Crushed', params: { bits: 6, rate: 9000, drive: 6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.5, mix: 0.35 } },
    ],
  },

  // Aurora: a brass pad through iron, and what a starved stream leaves of a choir pad.
  {
    id: 'static-cathedral-iron-brass-pad',
    name: 'Iron brass pad',
    category: 'pad',
    description:
      'A brass pad whose filter overshoot is pushed through a transformer and a horn loudspeaker on a far platform.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { resonance: 0.4, contour: 0.9, attack: 0.25, release: 5, detune: 14, volume: -10 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Iron lows',
        params: { drive: 0.7, push: 1, output: -8 },
      },
      { deviceId: 're-amp', preset: 'Station platform', params: { room: 0.5, output: -0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-thinned-choir-pad',
    name: 'Thinned choir pad',
    category: 'pad',
    description:
      'A resonant choir-like pad of which a starved stream keeps only the thin remainder, rising in fifths.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { resonance: 0.65, attack: 1.5, release: 6, ring: 0.25, volume: -10 },
    },
    effects: [
      { deviceId: 'low-bitrate', params: { loss: 0.42, mode: 1, frame: 2, smear: 0.4 } },
      { deviceId: 'shimmer', preset: 'Fifths', params: { width: 0.7, mix: 0.3 } },
    ],
  },

  // Bowed string: a low bow in the cold, and a string held at the edge of feedback.
  {
    id: 'static-cathedral-bow-and-static',
    name: 'Bow and static',
    category: 'string',
    description:
      'A bowed low string, heavy and dull, with radio static that swells up in the gaps when the bow stops.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.9, release: 2.5, pressure: 0.8, vibrato: 0.1, detune: 5, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.65, output: -13.5 } },
      {
        deviceId: 'noise-floor',
        preset: 'Radio static',
        params: { level: -34, follow: -1, response: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'static-cathedral-feedback-string',
    name: 'Feedback string',
    category: 'string',
    description:
      'A string held singing until it leans on its octave like feedback, tube-driven and drifting by a fraction of a hertz.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 1.5, pressure: 1, vibrato: 0.45, volume: -8 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 18, outputDb: -19 } },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { width: 0.4, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
    preview: 'line',
  },

  // Chamber strings: sections with the bow taken out.
  {
    id: 'static-cathedral-bowless-section',
    name: 'Bowless section',
    category: 'string',
    description:
      'A muted section that swells in slowly, smeared by long grains so no bow change is heard, glued and in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 6, attack: 2, release: 4, scatter: 0.8, volume: -8 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { spread: 0.4, mix: 0.7 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 9, outputDb: -8.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-starved-bows',
    name: 'Starved bows',
    category: 'string',
    description:
      'Bows that are mostly air, heard as if behind glass: the stream keeps the pitch and swirls the breath, in a long plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 5, attack: 1.8, release: 3, bow: 0.05, air: 1, volume: -8 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.65, stereo: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // Chord harp: strums that blur or bounce.
  {
    id: 'static-cathedral-strum-without-end',
    name: 'Strum without end',
    category: 'plucked',
    description:
      'A slow four-octave strum that never lands: each string blurs into the last and is played back from a far loudspeaker.',
    instrument: {
      deviceId: 'chord-harp',
      params: {
        strum: 140,
        direction: 2,
        span: 3,
        sustain: 8,
        tone: 0.35,
        pad: 0.4,
        spread: 0.8,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { width: 0.5, mix: 0.7 } },
      { deviceId: 're-amp', preset: 'Down the hall', params: { room: 0.6, output: -6 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-bouncing-toy-strum',
    name: 'Bouncing toy strum',
    category: 'plucked',
    description:
      'A two-octave toy strum at eight bits whose slices bounce and repeat, with a dripping spring behind.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 30, direction: 3, tone: 0.9, volume: 1 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'glitch', preset: 'Bouncing', params: { chance: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { width: 0.6, mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Clarinet: a rasping court reed and a bass clarinet in a small amplifier.
  {
    id: 'static-cathedral-rasping-doubled-reed',
    name: 'Rasping doubled reed',
    category: 'wind',
    description:
      'A nasal reed with a wide vibrato, doubled a few cents apart and pushed until it rasps, in a stone hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { growl: 0.35, vibrato: 0.7, attack: 0.3, release: 1, volume: -6 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Doubler', params: { spread: 0.5, mix: 0.45 } },
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.6, output: -4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-amplified-reed',
    name: 'Amplified reed',
    category: 'wind',
    description:
      'A bass clarinet re-recorded through a small amplifier, with a half-speed loop of its last phrase underneath.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.55, breath: 0.7, attack: 0.3, release: 1.2, growl: 0.2, volume: 0 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.55, bass: 0.3, distance: 0.4 },
      },
      { deviceId: 'micro-looper', preset: 'Half speed', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Dusk: the chorus polysynth clipped and shaken.
  {
    id: 'static-cathedral-aliased-strings',
    name: 'Aliased strings',
    category: 'pad',
    description:
      'A chorus polysynth pad clipped hard with no oversampling, so aliasing grit rides inside a warm chord, in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { wave: 0, resonance: 0.3, attack: 0.9, release: 3.5, chorus: 2, volume: -10 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Lo-fi',
        params: { driveDb: 22, toneDb: -4, outputDb: -22.5, mix: 0.7 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-shaking-floor',
    name: 'Shaking floor',
    category: 'pad',
    description:
      'Square wave and full sub octave through a stack on the edge of breaking up, in a small dark room.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 900, resonance: 0.4, attack: 0.8, chorus: 0, volume: -12 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { speaker: 2, output: -9.5 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },

  // Ember: a drone scattered frame by frame, and noise that a room sings back.
  {
    id: 'static-cathedral-scattered-drone',
    name: 'Scattered drone',
    category: 'pad',
    description:
      'A dark two-oscillator drone whose phases are scattered frame by frame, thickened by a heavy drive and left to hang.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { osc2Coarse: 0, subLevel: 0.2, cutoff: 700, ampAttack: 2, volume: -8 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Smeared haze', params: { stereo: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.5, output: -7.5 } },
      {
        deviceId: 'expanse',
        params: {
          size: 0.85,
          decay: 60,
          gravity: 0.6,
          density: 1,
          modDepth: 0.6,
          modRate: 0.15,
          lowCut: 60,
          highCut: 5000,
          width: 0.7,
          mix: 0.3,
        },
      },
    ],
  },
  {
    id: 'static-cathedral-singing-static',
    name: 'Singing static',
    category: 'texture',
    description:
      'Filtered noise that sweeps upward for two and a half seconds, through a dusty ten-bit sampler into a hall of moving vowels.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: { resonance: 0.65, filterAttack: 2.5, filterRelease: 3, ampRelease: 3, volume: 2.8 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { width: 0.7, mix: 0.45 } },
    ],
  },

  // Flute: bamboo and breath.
  {
    id: 'static-cathedral-bamboo-in-stone',
    name: 'Bamboo in stone',
    category: 'wind',
    description:
      'A bamboo flute with a hard chiff and a scooped pitch, bitten by a pentode stage and re-recorded far down a nave.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.75, chiff: 1, release: 1.2, vibrato: 0.4, scoop: 160, volume: -6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.5, output: -4 } },
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { speaker: 3, distance: 0.7, room: 0.35 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-swirled-breath',
    name: 'Swirled breath',
    category: 'wind',
    description:
      'A chord of low flutes that is nearly all breath, its air swirled by a starved stream and hung in a blur.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 2, release: 4, vibrato: 0, volume: -20.5 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Behind glass',
        params: { loss: 0.7, frame: 2, stereo: 0.4 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.5, mix: 0.5 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Glass: FM bells with converter images, and a pad split in two.
  {
    id: 'static-cathedral-mirrored-bell',
    name: 'Mirrored bell',
    category: 'bell',
    description:
      'An FM glass bell with converter images mirrored above it, and its strike returning backwards an octave up.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 9, brightness: 0.6, decay: 4, detune: 12, volume: -5.8 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-split-crystal',
    name: 'Split crystal',
    category: 'pad',
    description:
      'A slow FM pad pushed through a tube stage, then shifted up on one side and down on the other by three hertz.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.45, attack: 2.2, detune: 16, feedback: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 14, outputDb: -19 } },
      { deviceId: 'freq-shifter', preset: 'Split sky', params: { width: 0.5, mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
  },

  // Grain: written for whatever sound is loaded; the previews play the built-in soft tone.
  {
    id: 'static-cathedral-frozen-wall',
    name: 'Frozen wall',
    category: 'pad',
    description:
      'Whatever is loaded, frozen at one instant, overdriven and blurred into a wall for holding chords in a stone room.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { position: 0.2, attack: 1.5, release: 4, spread: 0.3, volume: -10 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube preamp',
        params: { driveDb: 20, toneDb: -2, outputDb: -24 },
      },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.3, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
      { deviceId: 'stereo-widener', params: { width: 0.4 } },
    ],
  },
  {
    id: 'static-cathedral-skipping-grains',
    name: 'Skipping grains',
    category: 'texture',
    description:
      'Short hard grains of the loaded sound stepping forward one at a time at ten bits, with repeats that climb in fifths.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: { position: 0.2, scan: 0.3, size: 60, attack: 0.01, release: 0.6, volume: -12.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { drive: 3 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Handpan: struck steel on a worn sampler, and slowed under itself.
  {
    id: 'static-cathedral-jittered-steel',
    name: 'Jittered steel',
    category: 'bell',
    description:
      'A steel pan struck firmly, on a ten-bit sampler with a jittering clock, with dark bucket-brigade repeats and a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { touch: 0.7, shimmer: 0.6, damp: 0.3, volume: -0.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { drive: 4 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-slowed-tongues',
    name: 'Slowed tongues',
    category: 'bell',
    description:
      'A tongue drum heard with itself an octave down at half speed, its ring blurred into a low halo in a plate.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 10, touch: 0.1, sympathy: 1, volume: -8.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { spread: 0.5, mix: 0.6 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.5, mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // Harp: a hard-plucked silk string crushed, and a concert harp behind its own reversal.
  {
    id: 'static-cathedral-crushed-silk-strings',
    name: 'Crushed silk strings',
    category: 'plucked',
    description:
      'A koto plucked hard near the bridge, crushed to five bits and re-recorded from across a room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { pluck: 0.05, touch: 0.85, decay: 2, bend: 60, volume: -2 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Crushed',
        params: { rate: 12000, drive: 9, mix: 0.8 },
      },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.45, treble: -0.5, distance: 0.6, room: 0.6, output: 4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-harp-turned-back',
    name: 'Harp turned back',
    category: 'plucked',
    description:
      'A long-ringing harp behind a cloud of its own reversed grains, with a halo an octave above.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.05, decay: 4, body: 0.2, volume: -6.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { spread: 0.4, mix: 0.5 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { width: 0.7, mix: 0.3 } },
    ],
  },

  // Ladder bass: the low end of the wall.
  {
    id: 'static-cathedral-blown-pedal-tone',
    name: 'Blown pedal tone',
    category: 'keys',
    description:
      'A beating one-voice bass drone through tube grit and a warm stack, close and heavy in a small room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 14, sub: 0.8, cutoff: 500, drive: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -14 } },
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: -11.5 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'static-cathedral-closing-filter',
    name: 'Closing filter',
    category: 'keys',
    description:
      'A resonant bass whose filter opens on each note and closes over six seconds, through twelve-bit converters in a small room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: { emphasis: 0.7, drive: 0.5, glide: 0.3, volume: -4.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 4, mix: 0.35 } },
    ],
    preview: 'line',
  },

  // Mallets: bars blurred, and a celesta over a failing line.
  {
    id: 'static-cathedral-rolled-metal-blur',
    name: 'Rolled metal blur',
    category: 'bell',
    description:
      'A rolled vibraphone chord blurred until the roll is a shimmer, drifting slightly sharp in a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { motor: 0.8, motorRate: 1.6, roll: 13, volume: -17.6 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.5, mix: 0.6 } },
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 1.2, width: 0.4, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-bad-line-celesta',
    name: 'Bad line celesta',
    category: 'bell',
    description:
      'A small celesta over a failing connection: packets drop and stick, and dark tape echoes fill the holes.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.6, decay: 1.8, damper: 0.3, volume: -7.2 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Bad connection' },
      { deviceId: 'tape-echo', params: { time: 440, feedback: 0.5, highCut: 3000, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Bells: the tower bell from inside the building, and a bowl out of true.
  {
    id: 'static-cathedral-tower-bell',
    name: 'Tower bell',
    category: 'bell',
    description:
      'A church bell struck hard and heard through stone from the far end of the building, softened and thickened by drive.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 20, hardness: 0.9, detune: 2.5, stretch: 0.96, volume: -6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.6 } },
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { speaker: 4, room: 0.6, output: -3.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-beating-bowl',
    name: 'Beating bowl',
    category: 'bell',
    description:
      'A rubbed bowl that sings while held, half of it moved up by seventeen hertz so it beats against itself.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { detune: 3, stretch: 1.04, brightness: 0.3, volume: -8.8 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Bell metal',
        params: { shift: 17, feedback: 0.3, width: 0.4, mix: 0.5 },
      },
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { stereo: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
    preview: 'hold',
  },

  // Outdoors: weather heard from inside.
  {
    id: 'static-cathedral-storm-outside',
    name: 'Storm outside',
    category: 'texture',
    description:
      'Distant thunder heard from inside: dulled by a room and by tape, and held in a long stone tail.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.8, distance: 0.5, tone: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.8 } },
      {
        deviceId: 'tape',
        params: { drive: 0.6, wow: 0.1, flutter: 0.05, speed: 1, hiss: 0.1, output: 3 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-stuck-chimes',
    name: 'Stuck chimes',
    category: 'texture',
    description:
      'Wind chimes over a stream that keeps sticking on a packet, so single strikes stutter under a rising halo.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.9, distance: 0.2, tone: 0.75, volume: -11 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Stuck stream', params: { loss: 0.5 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { width: 0.7, mix: 0.3 } },
    ],
  },

  // Pedal steel: slow steel with grit beneath, and a lead on a warped record.
  {
    id: 'static-cathedral-steel-under-grit',
    name: 'Steel under grit',
    category: 'plucked',
    description:
      'Slow-swelling steel with no vibrato, a parallel layer of pentode grit under it and grains scattered in open space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 2, pick: 0.1, tone: 1700, volume: -12.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit', params: { output: -4.5, mix: 0.45 } },
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { spread: 0.4, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-warped-lead-steel',
    name: 'Warped lead steel',
    category: 'plucked',
    description:
      'A singing steel line on a warped record, played through a bedside speaker with a long spring behind it.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { glide: 400, range: 7, vibrato: 35, tone: 3600, volume: -6 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.3 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { distance: 0.4, output: -4 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { width: 0.6, mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Sampler: written for whatever sound is loaded; the previews play the built-in soft tone.
  {
    id: 'static-cathedral-far-hall-loop',
    name: 'Far hall loop',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down on a wobbling loop, played through a loudspeaker and recorded from down the hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.2, release: 4, tone: 2600, wobble: 0.8, volume: -11 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -20 } },
      { deviceId: 're-amp', preset: 'Down the hall', params: { room: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'static-cathedral-backwards-converter',
    name: 'Backwards converter',
    category: 'texture',
    description:
      'The loaded sound played backwards into each note, through a worn nine-bit converter and a hall that climbs an octave.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { tune: -5, release: 2.5, tone: 6000, wobble: 0.4, volume: -10.7 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { width: 0.7, mix: 0.35 } },
    ],
  },

  // String machine: the seventies ensemble under fuzz, and its top octave folded.
  {
    id: 'static-cathedral-ensemble-under-fuzz',
    name: 'Ensemble under fuzz',
    category: 'string',
    description:
      'A seventies string ensemble under a dark pushed-triode fuzz, phased slowly and left in open space.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2, low: 0.9, drift: 0.8, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { drive: 0.55, output: -6 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-folded-high-strings',
    name: 'Folded high strings',
    category: 'string',
    description:
      'The top octave of a string ensemble folded back on itself by a six kilohertz sample rate, in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.8, tone: 10000, speed: 1.6, drift: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Metallic' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // Tanpura: the buzz driven to a roar, and the plain strings blurred to one tone.
  {
    id: 'static-cathedral-buzzing-wall',
    name: 'Buzzing wall',
    category: 'drone',
    description:
      'Four slowly plucked strings buzzing on their bridge, tube-driven so the overtone sweep roars, over tape hiss in stone.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 1, speed: 6, detune: 5, volume: -8 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 16, outputDb: -11 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-blurred-monochord',
    name: 'Blurred monochord',
    category: 'drone',
    description:
      'Plain strings with no buzz, plucked round and round and blurred into one unbroken tone that drifts in pitch.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 3, detune: 6, body: 0.8, volume: -14.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { width: 0.3, mix: 0.75 } },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { width: 0.4, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.5, mix: 0.3 } },
    ],
  },

  // Tape orchestra: reels re-amped and scattered.
  {
    id: 'static-cathedral-ruined-choir-reel',
    name: 'Ruined choir reel',
    category: 'voice',
    description:
      'A choir on tired tape that wobbles and drops out, re-recorded through a horn speaker and starved again by a stream.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 1, hiss: 0.7, length: 6, volume: -7 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { room: 0.5, output: -6.5 } },
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { stereo: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-slowed-reel-horns',
    name: 'Slowed reel horns',
    category: 'pad',
    description:
      'Horns from a reel at half speed, saturated and scattered into long grains that hang behind the chord.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { age: 0.7, attack: 0.8, release: 3.5, players: 1, vibrato: 0.2, volume: -10 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -15 } },
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { spread: 0.4, mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
  },

  // Thesis: bands of noise, clipped or starved.
  {
    id: 'static-cathedral-clipped-whistlers',
    name: 'Clipped whistlers',
    category: 'voice',
    description:
      'Narrow bands of noise that whistle at the played pitch and its mirror, limited hard and clipped into a hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 69, resonance: 80, width: 40, attack: 1, release: 3 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 16, outputGain: -4 } },
      {
        deviceId: 'saturator',
        preset: 'Hard clip master',
        params: { driveDb: 12, outputDb: -15.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'static-cathedral-wind-across-pipes',
    name: 'Wind across pipes',
    category: 'texture',
    description:
      'Broad dark bands of noise like wind across pipe mouths, swirled by a starved stream in a wide space.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { resonance: 12, width: 60, attack: 2, release: 3 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -6.5 } },
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.6, stereo: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.35 } },
    ],
    preview: 'low',
  },

  // Tine piano: an electric piano through a broken cone, and on a dusty sampler.
  {
    id: 'static-cathedral-tines-blown-cone',
    name: 'Tines, blown cone',
    category: 'keys',
    description:
      'A barking electric piano through a folded broken-speaker distortion and a small amplifier with a dark spring.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { tone: 0.7, drive: 0.8, volume: -8 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Blown speaker',
        params: { driveDb: 24, outputDb: -18, mix: 0.6 },
      },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { distance: 0.35, output: -8.8 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { width: 0.5, mix: 0.25 } },
    ],
  },
  {
    id: 'static-cathedral-dusty-tines',
    name: 'Dusty tines',
    category: 'keys',
    description:
      'Soft dark tines sampled at ten bits with a jittering clock, doubled a few cents sharp and flat, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 2.2, release: 1, tremolo: 0.4, tremoloRate: 0.7, volume: -14 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { drive: 4 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // West coast: a folding drone, and a pluck in splinters.
  {
    id: 'static-cathedral-slow-folding-tone',
    name: 'Slow folding tone',
    category: 'drone',
    description:
      'A slowly wavefolding tone held as a drone, sample-reduced, with grains an octave down in a stone tail.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.85, fm: 0.25, drift: 1, volume: -9.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 10000, bits: 10 } },
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { spread: 0.3, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'static-cathedral-splintered-pluck',
    name: 'Splintered pluck',
    category: 'plucked',
    description:
      'A woody low-pass-gate pluck cut into tiny repeating slices across octaves, with flickers of it drifting back.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.5, timbreEnv: 0.7, decay: 2, chance: 0.6, volume: -0.8 },
    },
    effects: [
      {
        deviceId: 'glitch',
        params: {
          time: 45,
          chance: 0.4,
          repeat: 0.8,
          skip: 0.8,
          reverse: 0.4,
          slow: 0,
          calm: 0,
          decay: 0,
          octaves: 0.6,
          spread: 0.8,
          mix: 0.7,
        },
      },
      { deviceId: 'echo-memory', preset: 'Flickers', params: { spread: 0.6, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Zither: hammered strings over the air, and doubled courses blurred upward.
  {
    id: 'static-cathedral-dulcimer-in-weather',
    name: 'Dulcimer in weather',
    category: 'plucked',
    description:
      'A rolled hammered dulcimer on medium wave with a storm coming: static swells whenever the signal fades.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 12, brightness: 0.7, sympathy: 1, volume: -13.5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Storm coming', params: { static: 0.5, mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'static-cathedral-rafter-zither',
    name: 'Rafter zither',
    category: 'plucked',
    description:
      'Doubled courses strummed into a pushed console stage, the ring blurred and lifted into a long stone tail.',
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        chord: 1,
        strum: 90,
        decay: 12,
        release: 8,
        brightness: 0.6,
        position: 0.2,
        courses: 0.85,
        sympathy: 0.8,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Console',
        params: { drive: 0.55, push: 1, output: -8 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.5, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
]
