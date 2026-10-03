import { type FactoryPreset } from '../types'

// Six Squared: short sad synth loops layered until they glow, pressed hard into hiss and left
// in a long dark reverb. Night music from England with rave in its memory.

export const PRESETS: readonly FactoryPreset[] = [
  // aurora: the big brass-and-string polysynth, driven and left in a dark hall
  {
    id: 'six-squared-sodium-glow',
    name: 'Sodium glow',
    category: 'pad',
    description:
      'Slow dark synth brass pushed hard into saturation over steady hiss, in a cathedral with the top damped away.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { brilliance: 900, attack: 1.2, swell: 0.8, release: 5, detune: 11, volume: -14 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -10.5 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.5 } },
    ],
  },
  {
    id: 'six-squared-ring-road-brass',
    name: 'Ring road brass',
    category: 'pad',
    description:
      'Polysynth brass that speaks quickly with a filter overshoot, through a console drive and a slow compressor.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 1700,
        resonance: 0.35,
        contour: 0.85,
        attack: 0.09,
        swell: 0.35,
        release: 2.2,
        detune: 7,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console edge', params: { drive: 0.5, output: -0.5 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { threshold: -28, makeup: 2 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 3800, mix: 0.35 },
      },
    ],
  },
  {
    id: 'six-squared-last-bus-strings',
    name: 'Last bus strings',
    category: 'pad',
    description:
      'Two beating string layers under a low-pass that opens and closes every half minute, on tape in a dark hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 3200, lowCut: 160, attack: 1.6, release: 5, detune: 16, volume: -12 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1400, resonance: 1.1, lfoAmount: 45, lfoRateHz: 0.035 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-estate-at-night',
    name: 'Estate at night',
    category: 'pad',
    description:
      'A narrow resonant band that sounds half sung, worn on cassette and answered by a low vowel hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { brilliance: 1200, lowCut: 300, attack: 2.4, release: 6, volume: -12 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.3, noise: 0.35 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 14, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-shut-filter-horns',
    name: 'Shut filter horns',
    category: 'pad',
    description:
      'Soft low horns with the filter nearly shut, warmed by a valve stage and let into a reverb in slow waves.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: {
        brilliance: 480,
        lowCut: 40,
        attack: 2.5,
        swell: 0.7,
        release: 6,
        detune: 9,
        volume: -9,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube Preamp',
        params: { driveDb: 9, toneDb: -2, outputDb: -9.5 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 10, damping: 0.6, mix: 0.4 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'six-squared-looped-fanfare',
    name: 'Looped fanfare',
    category: 'keys',
    description:
      'Short brass notes caught by a looper and run round as a soft bed, with tape repeats in a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 1400,
        contour: 0.7,
        attack: 0.03,
        swell: 0.2,
        release: 1.2,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Soft bed',
        params: { length: 1, fade: 0.7, tone: 5000, mix: 0.4 },
      },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 500, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.65, mix: 0.35 } },
    ],
  },
  {
    id: 'six-squared-shutters-going-up',
    name: 'Shutters going up',
    category: 'pad',
    description:
      'Each note opens with a falling metallic ring that melts into the pad, glazed by an early sampler in a plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 1500, attack: 0.5, release: 7, ring: 0.45, detune: 12, volume: -9.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 14000 } },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { threshold: -26, ratio: 3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
    ],
  },

  // dusk: the chorus polysynth of the bedroom studio
  {
    id: 'six-squared-wet-tarmac',
    name: 'Wet tarmac',
    category: 'pad',
    description:
      'The chorus polysynth with both chorus lines on, saturated and compressed over hiss in a long dark hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { cutoff: 1500, resonance: 0.2, attack: 1, release: 4.5, chorus: 3, volume: -15 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 10, outputDb: -5 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { threshold: -30, ratio: 3 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44, tone: -0.2 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2400, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-through-the-wall',
    name: 'Through the wall',
    category: 'organ',
    description:
      'A square-wave organ chord with full chorus played down a corridor, as if heard from outside the building.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { cutoff: 1300, attack: 0.03, release: 1.4, volume: -14 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { drive: 0.4, treble: -0.4 } },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3200, mix: 0.3 } },
    ],
  },
  {
    id: 'six-squared-comedown-strings',
    name: 'Comedown strings',
    category: 'pad',
    description:
      'A dark chord whose filter opens slowly while it is held, drifting on worn cassette tape into a plain hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 380, envelope: 0.7, attack: 3, release: 7, volume: -13.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5, hiss: 0.4 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 7, tone: 3500, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-under-the-flyover',
    name: 'Under the flyover',
    category: 'pad',
    description:
      'A square wave over its sub octave, pushed through a transformer for a low dark bed in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { sub: 0.5, cutoff: 1500, attack: 1.5, release: 5, chorus: 2, volume: -11.8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.55, lowBump: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 5, damping: 2500, mix: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'six-squared-thin-hours',
    name: 'Thin hours',
    category: 'pad',
    description:
      'A thin moving pulse with no sub, bass rolled off, held in a cave of dull short echoes over hiss.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { lowCut: 2, cutoff: 2600, attack: 2, release: 5, volume: -10 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Rides the sound', params: { level: -36 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { highCut: 2400, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-aerial-song',
    name: 'Aerial song',
    category: 'pad',
    description:
      'The filter singing above each key, almost a pure tone, with murky repeats in a damped cathedral.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.5, release: 4, chorus: 3, volume: -11.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { time: 700, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 3000, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'six-squared-arpeggio-in-rain',
    name: 'Arpeggio in rain',
    category: 'keys',
    description:
      'Short filtered saw notes for an analogue arpeggio, with dark delay repeats and a hall behind them.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: {
        wave: 0,
        sub: 0.2,
        cutoff: 500,
        resonance: 0.4,
        envelope: 0.7,
        attack: 0.003,
        release: 0.5,
        chorus: 1,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.55, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3500, mix: 0.3 } },
    ],
  },

  // ember: two oscillators, unison and a slow filter, pressed until they glow
  {
    id: 'six-squared-glowing-saws',
    name: 'Glowing saws',
    category: 'pad',
    description:
      'Four detuned saw voices under a slowly breathing filter, driven hard into saturation and compressed in a dark hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        cutoff: 1100,
        lfo1Rate: 0.06,
        lfo1Amount: 0.3,
        ampAttack: 1.6,
        ampRelease: 5,
        unisonVoices: 4,
        unisonDetune: 20,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 14, outputDb: -6.5 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { threshold: -30 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2800, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-warehouse-ghost',
    name: 'Warehouse ghost',
    category: 'pad',
    description:
      'A seven-voice saw stack with the filter pulled down and a long release, through a twelve-bit sampler and a huge room.',
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: {
        cutoff: 1500,
        filterSlope: 1,
        ampAttack: 0.4,
        ampRelease: 4,
        unisonDetune: 30,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 11000 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, highCut: 4200, mix: 0.45 },
      },
    ],
  },
  {
    id: 'six-squared-one-line-repeating',
    name: 'One line repeating',
    category: 'keys',
    description:
      'A soft gliding triangle lead that a tape loop repeats and wears down, layer on layer, in a dark hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 2,
        osc2Shape: 3,
        osc2Coarse: 12,
        oscMix: 0.25,
        cutoff: 2200,
        filterSlope: 0,
        ampAttack: 0.04,
        ampRelease: 1.2,
        lfo2Rate: 4.8,
        lfo2Amount: 0.006,
        voiceMode: 2,
        glide: 0.12,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2, feedback: 0.6, wear: 0.5, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 3200, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'six-squared-brass-over-hiss',
    name: 'Brass over hiss',
    category: 'pad',
    description:
      'Two-saw synth brass that speaks at once and then mellows, with hiss that rises as it plays, in a plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        cutoff: 800,
        filterEnvAmount: 0.5,
        filterAttack: 0.15,
        filterDecay: 2.5,
        filterSustain: 0.4,
        filterRelease: 2.5,
        ampAttack: 0.08,
        ampRelease: 3,
        unisonVoices: 3,
        unisonDetune: 12,
        unisonSpread: 0.8,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Rides the sound', params: { level: -34, response: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },
  {
    id: 'six-squared-cooling-towers',
    name: 'Cooling towers',
    category: 'drone',
    description:
      'A saw and a pulse an octave apart over a sub, barely open, fuzzed in parallel and breathing in a long reverb.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { cutoff: 340, lfo1Rate: 0.04, ampAttack: 4, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz bed', params: { mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 12, damping: 0.55, mix: 0.4 },
      },
    ],
  },
  {
    id: 'six-squared-frost-on-glass',
    name: 'Frost on glass',
    category: 'pad',
    description:
      'A triangle with a thin pulse an octave up, widened by detuned copies, with a faint octave halo above.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { cutoff: 3800, ampAttack: 1.4, ampRelease: 6, volume: -8.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.25, tone: 4000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'six-squared-fruit-machine-fifths',
    name: 'Fruit machine fifths',
    category: 'keys',
    description:
      'A plucked triangle and pulse with a fast filter snap, repeated by a delay whose echoes jump a fifth.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { cutoff: 420, filterDecay: 0.2, ampDecay: 0.9, ampRelease: 0.6, volume: 2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 9, outputDb: -6 } },
      {
        deviceId: 'analog-delay',
        preset: 'Fifths and fourths',
        params: { time: 300, feedback: 0.5, mix: 0.35 },
      },

      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, highCut: 4500, mix: 0.3 } },
    ],
  },

  // string-machine: the ensemble strings, slowed and pressed into tape
  {
    id: 'six-squared-streetlamp-strings',
    name: 'Streetlamp strings',
    category: 'string',
    description:
      'The string ensemble with its tone rolled down, saturated and held level by a slow compressor in a damped cathedral.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 1.2,
        release: 4,
        low: 0.5,
        tone: 2200,
        ensemble: 0.9,
        speed: 0.8,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 11, outputDb: -6 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { threshold: -28, ratio: 3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2500, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-car-park-cellos',
    name: 'Car park cellos',
    category: 'string',
    description:
      'Only the low octave of the ensemble, thickened by a driven preamp, in a small dark concrete room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.4, release: 3.5, tone: 900, drift: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.5 } },
      {
        deviceId: 'expanse',
        preset: 'Small dark room',
        params: { decay: 3, size: 0.25, mix: 0.35 },
      },
    ],
  },
  {
    id: 'six-squared-top-deck-phaser',
    name: 'Top deck phaser',
    category: 'string',
    description:
      'The top octave of the ensemble alone through a very slow phaser, with a long plate taking the edge off.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.8, release: 5, tone: 4200, ensemble: 0.8, width: 0.6, volume: -7 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow Swirl',
        params: { rate: 0.05, feedback: 45, stereo: 60, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-fog-on-the-bypass',
    name: 'Fog on the bypass',
    category: 'pad',
    description: 'Strings that swell in slowly, their spectrum smeared into a dark wash in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { tone: 1500, drift: 0.7, width: 0.6, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { highCut: 3000, width: 0.6, mix: 0.5 },
      },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { midDecay: 4.5, damping: 2800, mix: 0.35 },
      },
    ],
  },
  {
    id: 'six-squared-flyer-in-a-drawer',
    name: 'Flyer in a drawer',
    category: 'keys',
    description:
      'Bare saw chords with no ensemble, sampled at twelve bits and left going round on a wearing tape loop.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.01, release: 0.7, tone: 3000, low: 0.4, width: 0.3, volume: -9.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 12000 } },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 1.5, feedback: 0.65, wear: 0.6, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.35 } },
    ],
  },
  {
    id: 'six-squared-hiss-between-songs',
    name: 'Hiss between songs',
    category: 'string',
    description:
      'A thin, drifting ensemble on a worn reel that lets go quickly, with tape hiss that swells up in every gap.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 0.35,
        release: 1.1,
        low: 0.2,
        high: 0.6,
        tone: 2600,
        ensemble: 1,
        speed: 0.5,
        drift: 0.8,
        volume: -10.5,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { drive: 0.55, wear: 0.5, noise: 0.2 },
      },
      { deviceId: 'noise-floor', preset: 'Breathing recorder', params: { level: -32 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.35 } },
    ],
  },

  // wavetable: slowly turning timbres in place of a filter sweep
  {
    id: 'six-squared-night-bus-window',
    name: 'Night bus window',
    category: 'pad',
    description:
      'A wavetable turning slowly under a low filter, saturated and compressed until it glows in a dark hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.4,
        motion: 0.6,
        rate: 0.06,
        cutoff: 1600,
        attack: 1.8,
        release: 5,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 12, outputDb: -8 } },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { threshold: -28, ratio: 2.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2700, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-slow-night-voices',
    name: 'Slow night voices',
    category: 'pad',
    description:
      'Vowel shapes that change over twenty seconds, filtered down and recorded to a slow reel before a cathedral.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { cutoff: 2400, sub: 0.25, attack: 2.8, release: 6, volume: -12.7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, drive: 0.45, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-rooftops-at-five',
    name: 'Rooftops at five',
    category: 'pad',
    description:
      'A reed tone that sharpens to a saw and back in a slow cycle, glowing through a triode into a huge space.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.4,
        motion: 1,
        rate: 0.04,
        detune: 14,
        cutoff: 3000,
        attack: 1.5,
        release: 5,
        spread: 0.5,
        volume: -16,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Glowing triode', params: { drive: 0.45, tone: -0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 4000, width: 0.7, mix: 0.4 },
      },
    ],
  },
  {
    id: 'six-squared-empty-platform',
    name: 'Empty platform',
    category: 'pad',
    description:
      'A woody, odd-harmonic table with a strong sub that swells and sinks at random, in a dark hall.',
    instrument: {
      deviceId: 'wavetable',
      params: {
        table: 3,
        position: 0.35,
        motion: 0.6,
        rate: 0.05,
        detune: 11,
        sub: 0.45,
        cutoff: 1500,
        resonance: 0.25,
        attack: 2.5,
        release: 6,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.2, depth: 0.5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 7, damping: 0.65, breathDepth: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'six-squared-mist-on-the-canal',
    name: 'Mist on the canal',
    category: 'pad',
    description:
      'A spectral table that arrives over several seconds, broken into slow grains and left in a long falling reverb.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { cutoff: 3500, rate: 0.04, attack: 5, release: 9, spread: 0.5, volume: -9.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { spread: 0.5, mix: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { width: 0.4, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-substation',
    name: 'Substation',
    category: 'drone',
    description:
      'A still, nearly pure tone given harmonics by a valve, over fifty-hertz mains hum in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { position: 0.12, sub: 0.25, cutoff: 900, attack: 3, release: 6, volume: -8 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube Preamp',
        params: { driveDb: 18, bias: 0.35, toneDb: 0, outputDb: -17.7 },
      },
      { deviceId: 'noise-floor', params: { type: 3, level: -40, movement: 0.4, width: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 5, damping: 2600, mix: 0.35 } },
    ],
  },
  {
    id: 'six-squared-small-hours-melody',
    name: 'Small hours melody',
    category: 'keys',
    description:
      'A soft rounded key sound that starts at once and rings for two seconds, with dotted tape repeats in a dark hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.55,
        motion: 0.2,
        cutoff: 2200,
        sub: 0.1,
        attack: 0.008,
        release: 2,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 450, heads: 3, feedback: 0.5, highCut: 3800, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 3200, mix: 0.35 } },
    ],
  },

  // choir: wordless voices, sampled, slowed and half buried
  {
    id: 'six-squared-borrowed-choir',
    name: 'Borrowed choir',
    category: 'voice',
    description:
      'An open Ah choir as an early sampler would play it back, grainy at twelve bits, in a very large room.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.4, release: 3.5, tone: 4500, vibrato: 6, volume: -11 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 10000, jitter: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, highCut: 4500, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-late-service',
    name: 'Late service',
    category: 'voice',
    description:
      'Low men singing Oh with no vibrato, pushed into soft saturation, in a cathedral with the highs damped.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 2.2, release: 5, tone: 2600, volume: -11 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 9, outputDb: -9.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2000, mix: 0.5 } },
    ],
  },
  {
    id: 'six-squared-breath-on-the-mic',
    name: 'Breath on the mic',
    category: 'voice',
    description:
      'Almost all breath and very little voice, under a band-pass that drifts slowly, with a halo an octave down.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 3, release: 6, tone: 4500, volume: -9.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 2, cutoffHz: 1000, resonance: 0.9, lfoAmount: 40, lfoRateHz: 0.05 },
      },
      { deviceId: 'shimmer', preset: 'Undertow', params: { shimmer: 0.35, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-vowels-turning',
    name: 'Vowels turning',
    category: 'voice',
    description:
      'A choir that moves through its vowels as it holds, on a slow seasick reel, let into a reverb in waves.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 3.2, tone: 4000, volume: -9.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, drive: 0.45 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 9, damping: 0.55, mix: 0.4 },
      },
    ],
  },
  {
    id: 'six-squared-one-voice-remembered',
    name: 'One voice remembered',
    category: 'voice',
    description:
      'A single singer with a wide vibrato whose phrases drift back later, dulled, under a damped cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vowel: 0.15, vibrato: 24, attack: 0.25, release: 1.2, tone: 5000, volume: -4.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { reach: 8, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2800, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'six-squared-high-and-far-away',
    name: 'High and far away',
    category: 'voice',
    description: 'Trebles on a soft Oo that swell in backwards behind themselves, in a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 1.2, release: 4, tone: 5500, volume: -10 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1400, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.55, mix: 0.4 } },
    ],
  },

  // tape-orchestra: orchestral sections on worn strips of tape, looped
  {
    id: 'six-squared-strings-off-the-reel',
    name: 'Strings off the reel',
    category: 'string',
    description:
      'A violin section swelling in from tired tape, saturated, compressed and left in a dark cathedral.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { age: 0.5, hiss: 0.3, tone: -0.3, attack: 1.2, release: 2.5, volume: -11 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -6 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { threshold: -28, makeup: 1 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-half-speed-horn-rumble',
    name: 'Half-speed horn rumble',
    category: 'pad',
    description:
      'French horns on tape at half speed, an octave down and dull, over room rumble in a huge space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { tone: -0.2, attack: 0.6, release: 3, players: 0.9, volume: -12.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -42 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 3600, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-choir-on-a-loop',
    name: 'Choir on a loop',
    category: 'voice',
    description:
      'A worn tape choir caught on a four-second loop between two decks, each pass duller, in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 0.7, attack: 0.5, release: 2, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.7, wear: 0.5, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-cellos-under-hiss',
    name: 'Cellos under hiss',
    category: 'string',
    description:
      'Half-speed tape cellos with their own hiss turned up, weighted by a transformer in a damped hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { hiss: 0.55, tone: -0.1, attack: 1, release: 3, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 4.5, damping: 2400, mix: 0.35 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'six-squared-flute-phrase-looped',
    name: 'Flute phrase looped',
    category: 'wind',
    description:
      'Breathy tape flutes whose last second is looped as a soft bed, with murky repeats and a small dark plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.55, tone: -0.2, attack: 0.05, release: 0.8, volume: -6 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 1, tone: 4000, mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { time: 600, mix: 0.3 } },
      {
        deviceId: 'dattorro',
        preset: 'Small plate',
        params: { decay: 0.7, damping: 0.65, mix: 0.3 },
      },
    ],
    preview: 'keys',
  },
  {
    id: 'six-squared-reeds-across-a-field',
    name: 'Reeds across a field',
    category: 'wind',
    description:
      'A tape reed section under a slowly moving low-pass, in a reverb that swells up after each chord.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { age: 0.4, attack: 0.3, release: 1.5, players: 0.8, volume: -10 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1300, resonance: 1, lfoAmount: 40, lfoRateHz: 0.06, lfoShape: 1 },
      },
      {
        deviceId: 'shaped-reverb',
        preset: 'Slow bloom',
        params: { time: 3.5, highCut: 4500, mix: 0.45 },
      },
    ],
    preview: 'chord',
  },

  // felt-piano: a soft piano at the end of a long dark hall
  {
    id: 'six-squared-piano-down-the-landing',
    name: 'Piano down the landing',
    category: 'keys',
    description:
      'A close, heavily felted piano with its own room turned off, on cassette in a cathedral with the highs damped.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { hardness: 0.2, reverbMix: 0, outputDb: -18 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.3, hiss: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2400, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-piano-from-a-sampler',
    name: 'Piano from a sampler',
    category: 'keys',
    description:
      'A bare, harder piano through the grain of an early sampler, each phrase kept going round on a tape loop.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.5, thump: 0.2, reverbMix: 0.05, outputDb: -11.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 13000, jitter: 0.25 } },
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3, feedback: 0.6, wear: 0.45, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
  },

  // tine-piano: electric piano from the other room
  {
    id: 'six-squared-tines-after-midnight',
    name: 'Tines after midnight',
    category: 'keys',
    description:
      'A dull, bell-less electric piano under a deep slow chorus, saturated and left in a damped hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 2, release: 0.9, tone: 0.3, volume: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { depth: 60, mix: 0.4 } },
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 8, outputDb: -10.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 2800, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-keys-from-next-door',
    name: 'Keys from next door',
    category: 'keys',
    description:
      'Bell tines played short, heard thin through a small speaker across a room, with three tape heads repeating.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { release: 0.15, hardness: 0.9, tremolo: 0, volume: -15 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { distance: 0.5, room: 0.5, noise: 0.25 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 420, feedback: 0.45, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.3 } },
    ],
  },

  // acoustic-guitar: wood and nylon, dulled and dissolved
  {
    id: 'six-squared-nylon-in-the-stairwell',
    name: 'Nylon in the stairwell',
    category: 'plucked',
    description:
      'A nylon-string guitar played with the flesh of the thumb, soft and dull, on tape in a long concrete echo.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.05, tone: 0.35, release: 4, volume: 0 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2800, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-steel-string-dissolving',
    name: 'Steel string dissolving',
    category: 'pad',
    description:
      'Ringing steel strings with the pick removed by a swell, their spectrum smeared into a slow wash in a huge room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { tone: 0.5, strum: 40, volume: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 450 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { highCut: 5000, width: 0.6, mix: 0.7 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { highCut: 4000, width: 0.7, mix: 0.35 },
      },
    ],
    preview: 'keys',
  },

  // guitar: one clean electric, rarely, and never dry
  {
    id: 'six-squared-wet-road-guitar',
    name: 'Wet road guitar',
    category: 'plucked',
    description:
      'A slow clean strum on the neck pickup with a dark chorus echo behind it and a damped hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { tone: 2400, warmth: 0.6, volume: -2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 440, tone: 2600, mix: 0.35 },
      },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { midDecay: 3.5, damping: 3000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'six-squared-guitar-with-no-attack',
    name: 'Guitar with no attack',
    category: 'pad',
    description:
      'Every note swells in over a second like a bowed string, saturated, with a low octave under the reverb.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1.6, tone: 2600, sustain: 22, volume: 2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -6 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { shimmer: 0.3, decay: 10, mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // pedal-steel: long slides seen from a long way off
  {
    id: 'six-squared-steel-over-the-estuary',
    name: 'Steel over the estuary',
    category: 'plucked',
    description:
      'Steel guitar notes that swell in with no vibrato and ring for half a minute, warmed and set far back in a huge space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, tone: 2200, volume: -11 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.45 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, highCut: 3800, width: 0.8, mix: 0.45 },
      },
    ],
  },
  {
    id: 'six-squared-slide-through-static',
    name: 'Slide through static',
    category: 'plucked',
    description:
      'Long steel slides heard over a medium-wave radio, thin and narrow with static under them, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { vibrato: 10, volume: -9 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Kitchen radio',
        params: { static: 0.25, fading: 0.3, bandwidth: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3500, mix: 0.4 } },
    ],
  },

  // harp: plucked strings left to hang
  {
    id: 'six-squared-harp-on-a-slow-reel',
    name: 'Harp on a slow reel',
    category: 'plucked',
    description:
      'Silk strings plucked lightly with a long ring, dulled by a slow reel and held in a small dark room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 0, decay: 2, volume: 1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, drive: 0.4, hiss: 0.3 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 4, size: 0.3, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-harp-run-backwards',
    name: 'Harp run backwards',
    category: 'plucked',
    description:
      'A long-ringing harp whose notes come back reversed and swelling a second later, in a long plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.2, volume: -5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 1000, smooth: 0.7, tone: 4000, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
  },

  // chord-harp: a strum-plate chord under the streetlights
  {
    id: 'six-squared-strum-under-streetlight',
    name: 'Strum under streetlight',
    category: 'plucked',
    description:
      'A soft brushed chord with its pad layer turned up, thickened by a slow ensemble and let into a reverb in waves.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { strum: 20, sustain: 6, pad: 0.6, tone: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 9, damping: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-falling-chord',
    name: 'Falling chord',
    category: 'plucked',
    description:
      'A slow strum up and down four octaves whose grain echoes drop an octave each time, in a long dark plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { tone: 0.3, volume: -5.5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.35 } },
    ],
  },

  // zither: wires in a box, hammered or slowed
  {
    id: 'six-squared-hammered-wires-at-night',
    name: 'Hammered wires at night',
    category: 'plucked',
    description:
      'Rolled dulcimer hammers on doubled strings, pressed into soft saturation, ringing on in a damped cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 7, brightness: 0.4, volume: -13 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 9, outputDb: -7.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-one-string-slowed',
    name: 'One string slowed',
    category: 'plucked',
    description:
      'A single felt-hammered string with a half-speed copy an octave under it and worn tape repeats.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 7, release: 4, volume: -8 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 4000, mix: 0.45 } },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 560, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.3 } },
    ],
  },

  // handpan: steel slowed down, dulled and looped
  {
    id: 'six-squared-slowed-steel-pan',
    name: 'Slowed steel pan',
    category: 'bell',
    description:
      'Low handpan notes struck softly and mostly heard at half speed, an octave down, on tape in a dark hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { touch: 0.2, shimmer: 0.2, volume: -6 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 3500, mix: 0.65 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 2600, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-wearing-drum-loop',
    name: 'Wearing drum loop',
    category: 'bell',
    description:
      'A soft tongue drum caught on a two-second tape loop that wears each pass down, driven warm in a huge room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 4, damp: 0.2, volume: -7 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2, feedback: 0.7, wear: 0.6, mix: 0.45 },
      },
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9, highCut: 3500, mix: 0.3 } },
    ],
  },

  // mallets: bars and tubes with the motor running
  {
    id: 'six-squared-vibes-motor-running',
    name: 'Vibes, motor running',
    category: 'bell',
    description:
      'Soft vibraphone bars with a slow motor throb and a long ring, on tape in a damped cathedral.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.2, decay: 2, motor: 0.6, motorRate: 2.4, volume: -10.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, wow: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2800, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-rolled-marimba-haze',
    name: 'Rolled marimba haze',
    category: 'pad',
    description:
      'A held chord rolled on soft marimba bars until it is a pad, saturated and blurred into a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.1, roll: 9, volume: -17 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 8, outputDb: -9 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { highCut: 6000, width: 0.6, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.35 } },
    ],
  },

  // modal-bells: metal heard across the town
  {
    id: 'six-squared-far-church-bell',
    name: 'Far church bell',
    category: 'bell',
    description:
      'A church bell with its top rolled off, heard far away through sparse dark echoes.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { hardness: 0.45, brightness: 0.3, decay: 18, volume: -4.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 4500, lowCut: 80 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 14, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-loft-music-box',
    name: 'Loft music box',
    category: 'bell',
    description:
      'Small hard metal bars looped as a soft bed behind themselves, on a worn cassette in a dark hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { hardness: 0.6, brightness: 0.45, decay: 4, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Soft bed',
        params: { length: 1.5, tone: 5000, mix: 0.4 },
      },
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.5, noise: 0.35 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { midDecay: 3.5, damping: 3000, mix: 0.35 },
      },
    ],
  },

  // fm-glass: the digital bells of a late-eighties rack
  {
    id: 'six-squared-long-hall-bells',
    name: 'Long hall bells',
    category: 'bell',
    description:
      'Soft FM bells with the brightness held down, with dark repeats in a cathedral whose highs are damped.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { brightness: 0.3, decay: 3.5, detune: 8, volume: -6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 500, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 3000, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-slow-beating-pad',
    name: 'Slow beating pad',
    category: 'pad',
    description:
      'An FM pad with slowly beating operator pairs, saturated and compressed over steady hiss in a huge dark space.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.28, attack: 2, release: 6, detune: 12, spread: 0.6, volume: -13 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -6 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { threshold: -28, ratio: 3, makeup: -3 },
      },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 4000, mix: 0.4 } },
    ],
  },

  // bowed-string: one string held for as long as it takes
  {
    id: 'six-squared-string-that-never-stops',
    name: 'String that never stops',
    category: 'string',
    description:
      'A string held singing by a magnetic sustainer, swelling in slowly, saturated in a damped cathedral.',
    instrument: {
      deviceId: 'bowed-string',
      params: { attack: 2, release: 4, brightness: 0.4, vibrato: 0.1, detune: 9, volume: -16 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 9, outputDb: -11 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-bow-in-the-underpass',
    name: 'Bow in the underpass',
    category: 'drone',
    description:
      'A low bowed string with heavy pressure and a big wooden body, on tape, breathing in a long reverb.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1.5, release: 3, pressure: 0.65, vibrato: 0.1, volume: -12.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, bump: 0.7 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 10, damping: 0.6, mix: 0.4 },
      },
    ],
  },

  // chamber-strings: a few real bows, muted and taped
  {
    id: 'six-squared-muted-quartet-on-tape',
    name: 'Muted quartet on tape',
    category: 'string',
    description:
      'Four muted players with no vibrato swelling in over two seconds, recorded to tape in a damped cathedral.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 4, attack: 2.2, release: 4, scatter: 0.5, volume: -9.7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2500, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-bows-and-breath',
    name: 'Bows and breath',
    category: 'string',
    description:
      'Bows barely touching, more air than note, under a slowly moving low-pass with microphone air in a huge room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 1.6, release: 3, volume: -9 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1800, resonance: 0.9, lfoAmount: 40, lfoRateHz: 0.05 },
      },
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -44 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10, highCut: 4500, mix: 0.4 } },
    ],
  },

  // horns: real brass standing in for the big polysynth, and a band heard from the street
  {
    id: 'six-squared-low-brass-at-closing',
    name: 'Low brass at closing',
    category: 'wind',
    description:
      'A full low brass section that speaks slowly, warmed by saturation and breathing in a long reverb.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.45, release: 5, volume: -8 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 8, outputDb: -5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 10, damping: 0.6, mix: 0.4 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'six-squared-distant-band-practice',
    name: 'Distant band practice',
    category: 'wind',
    description:
      'A trumpet section blown softly, recorded from the far end of a room and left in a damped cathedral.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.5, breath: 0.1, attack: 0.9, release: 2.5, volume: -7 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.6, room: 0.5 } },
      { deviceId: 'stereo-widener', params: { width: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // flute: mostly breath
  {
    id: 'six-squared-breath-in-the-vents',
    name: 'Breath in the vents',
    category: 'wind',
    description:
      'Low flutes blown so softly they are mostly air, held as a chord under a slow low-pass in a huge room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 2, release: 4, vibrato: 0.1, volume: -18 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1600, resonance: 0.9, lfoAmount: 45, lfoRateHz: 0.04 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, highCut: 4000, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'six-squared-last-train-flute',
    name: 'Last train flute',
    category: 'wind',
    description:
      'One low flute line with no chiff and a little vibrato, on tape with murky repeats in a damped hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { chiff: 0, attack: 0.4, release: 2.5, volume: -10.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, wow: 0.35 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { time: 750, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 2800, mix: 0.4 } },
    ],
  },

  // clarinet: a reed coming out of nothing
  {
    id: 'six-squared-clarinet-from-nothing',
    name: 'Clarinet from nothing',
    category: 'wind',
    description:
      'A clarinet line whose notes swell in from silence and take three seconds to leave, saturated in a damped cathedral.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.45, breath: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 8, outputDb: -8 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-reed-an-octave-under',
    name: 'Reed an octave under',
    category: 'wind',
    description:
      'A breathy bass clarinet with a half-speed copy of itself an octave below, on a slow reel in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { breath: 0.6, attack: 0.4, release: 1.5, volume: -5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { highCut: 2000, mix: 0.45 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, drive: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, damping: 2600, mix: 0.35 } },
    ],
  },

  // organ: a small chapel organ, turning slowly
  {
    id: 'six-squared-chapel-on-the-corner',
    name: 'Chapel on the corner',
    category: 'organ',
    description:
      'Soft flute ranks through a slowly turning speaker heard across the room, on tape in a damped cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.3, release: 1.5, tone: 3200, volume: -14 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.7, spread: 0.7 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.4, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-harmonium-in-the-hall',
    name: 'Harmonium in the hall',
    category: 'organ',
    description:
      'A low reed drone with a beating second rank and a slow bellows, saturated and compressed in a huge dark space.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { celeste: 0.7, reed: 0.3, tone: 1500, attack: 2.2, release: 5, volume: -15 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -9 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Glue',
        params: { threshold: -26, ratio: 2.5, makeup: -2 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 3500, mix: 0.4 } },
    ],
  },

  // drone: the glow over the town
  {
    id: 'six-squared-motorway-at-a-distance',
    name: 'Motorway at a distance',
    category: 'drone',
    description:
      'A just minor chord of slowly wandering partials over a deep sub, driven into saturation in a damped hall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { cutoff: 700, attack: 4, release: 10, air: 0.3, volume: -13 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -9.5 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 5, midDecay: 4, damping: 2400, mix: 0.4 },
      },
    ],
  },
  {
    id: 'six-squared-glow-over-the-town',
    name: 'Glow over the town',
    category: 'drone',
    description:
      'One key held as a just major chord with tuned air in it, filtered down and compressed over steady hiss in a huge room.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { cutoff: 1800, movement: 0.6, attack: 3, release: 8, width: 0.7, volume: -11 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { threshold: -28, makeup: 1.5 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -42, tone: -0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, highCut: 3800, width: 0.8, mix: 0.4 },
      },
    ],
    preview: 'hold',
  },

  // tanpura: a plucked drone, slowed until it stops being Indian
  {
    id: 'six-squared-plucked-drone-slowed',
    name: 'Plucked drone, slowed',
    category: 'drone',
    description:
      'Four buzzing strings plucked round every ten seconds, most of it heard at half speed on tape in a dark hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 3000, mix: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 2600, mix: 0.4 } },
    ],
  },
  {
    id: 'six-squared-strings-by-lamplight',
    name: 'Strings by lamplight',
    category: 'drone',
    description:
      'Four plucked drone strings with the buzz taken off the bridge, plain and round, with murky repeats in a cathedral.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 6, body: 0.7, volume: -6 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { time: 850, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2400, mix: 0.4 } },
    ],
  },

  // atmosphere: the weather outside the room the music is made in
  {
    id: 'six-squared-bus-shelter-rain',
    name: 'Bus shelter rain',
    category: 'texture',
    description:
      'Steady rain close overhead with single drops in it, recorded hot to cassette in a small close room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.7, tone: 0.4, size: 0.3, width: 0.6, volume: 0 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { drive: 0.9, hiss: 0.2, output: 1 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'six-squared-wind-round-the-tower',
    name: 'Wind round the tower',
    category: 'texture',
    description:
      'Gusting wind with a faint whistle on the held note, under a slow low-pass, far off in a huge space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { density: 0.55, movement: 0.75, tone: 0.4, resonance: 0.4, width: 0.6, volume: -2 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1500, resonance: 0.8, lfoAmount: 40, lfoRateHz: 0.05 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, highCut: 4000, width: 0.8, mix: 0.35 },
      },
    ],
  },

  // outdoors: what is heard on the walk home
  {
    id: 'six-squared-blackbird-before-buses',
    name: 'Blackbird before buses',
    category: 'texture',
    description:
      'One blackbird singing close by at daybreak, on quiet tape with a little open air round it.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'One blackbird',
      params: { distance: 0.25, attack: 1, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.15, hiss: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 5, highCut: 5000, mix: 0.25 } },
    ],
  },
  {
    id: 'six-squared-thunder-over-the-moor',
    name: 'Thunder over the moor',
    category: 'texture',
    description:
      'Far thunder that rolls in with the key and comes back now and then, with room rumble under it in a huge dark space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.7, tone: 0.35, volume: -3 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, lowCut: 30, highCut: 3000, mix: 0.35 },
      },
    ],
  },

  // grain-synth: whatever is loaded, held still or run backwards (previews play its built-in soft tone)
  {
    id: 'six-squared-any-sound-frozen',
    name: 'Any sound, frozen',
    category: 'pad',
    description:
      'One instant of whatever is loaded held as a dense, dull cloud, saturated and compressed in a damped cathedral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { position: 0.2, detune: 8, attack: 1.8, release: 5, tone: 3500, volume: -13 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -6 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { threshold: -28, ratio: 3, makeup: -2 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-any-sound-reversed',
    name: 'Any sound, reversed',
    category: 'texture',
    description:
      'Long reversed grains creeping back through whatever is loaded, piled up on a slowed tape loop in a hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { position: 0.15, scan: -0.1, spread: 0.5, tone: 4500, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 4, feedback: 0.6, spread: 0.3, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 3000, mix: 0.35 } },
    ],
  },

  // sampler: whatever is loaded, the way a rave-era sampler would have used it (previews play its built-in soft tone)
  {
    id: 'six-squared-borrowed-sound-slowed',
    name: 'Borrowed sound, slowed',
    category: 'pad',
    description:
      'Whatever is loaded an octave down on an unsteady loop, saturated over steady hiss in a damped cathedral.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.2, release: 4, tone: 3000, wobble: 0.6, volume: -22 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -8.5 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 2600, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-old-sampler-stab',
    name: 'Old sampler stab',
    category: 'keys',
    description:
      'Whatever is loaded played once per key as a short stab, at twelve bits, with dotted tape repeats in a huge room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { start: 0.1, end: 0.5, release: 0.5, tone: 6000, volume: -11 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 11000 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dub wash',
        params: { time: 400, feedback: 0.55, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10, highCut: 4000, mix: 0.3 } },
    ],
  },

  // thesis: bands of filtered noise, the hiss given pitch
  {
    id: 'six-squared-whistling-wires',
    name: 'Whistling wires',
    category: 'texture',
    description:
      'Narrow bands of noise that whistle on the held note and its mirror, breathing slowly in a damped cathedral.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 66, resonance: 70, attack: 2, release: 5, breatheRate: 0.12 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 12, outputGain: -1.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 3000, mix: 0.45 } },
    ],
  },
  {
    id: 'six-squared-draught-under-the-door',
    name: 'Draught under the door',
    category: 'texture',
    description:
      'Broad low bands of noise whose pitch wanders, like air moving in a pipe, saturated in a breathing reverb.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { attack: 2.5, release: 6, resonance: 20 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 2 } },
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 8, outputDb: -12 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 10, damping: 0.6, mix: 0.4 },
      },
    ],
    preview: 'low',
  },

  // west-coast: wooden plucks for a sequence, and a slow fold
  {
    id: 'six-squared-wooden-sequence',
    name: 'Wooden sequence',
    category: 'keys',
    description:
      'Soft, dull mallet plucks through a low-pass gate, for a slow sequence, with dark repeats in a damped hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 1.2, colour: 0.35, chance: 0.2, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 450, feedback: 0.55, spread: 0.6, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.35 } },
    ],
  },
  {
    id: 'six-squared-slow-fold-at-dusk',
    name: 'Slow fold at dusk',
    category: 'pad',
    description:
      'A held tone that folds into more harmonics as it swells and drifts in pitch, widened in a huge dark space.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.4, colour: 0.5, attack: 2.5, drift: 0.6, volume: -11 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thick double', params: { mix: 0.35 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 3500, width: 0.8, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },

  // ladder-bass: the sub and the sequence underneath
  {
    id: 'six-squared-sub-under-everything',
    name: 'Sub under everything',
    category: 'keys',
    description:
      'A soft square sub with the filter kept low, given harmonics by a valve so it carries, in a short room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { sub: 0.7, cutoff: 400, glide: 0.2, volume: -12 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube Preamp',
        params: { driveDb: 12, toneDb: 0, outputDb: -13.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { damping: 3000, mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'six-squared-sequence-in-the-cellar',
    name: 'Sequence in the cellar',
    category: 'keys',
    description:
      'A plucked bass with a quick filter snap for an analogue sequence, with dark repeats in a small dark room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Sequence bass',
      params: { cutoff: 550, emphasis: 0.4, decay: 0.6, drive: 0.6, glide: 0.03, volume: -1 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 2.5, mix: 0.3 } },
    ],
    preview: 'line',
  },
]
