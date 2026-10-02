import { type FactoryPreset } from '../types'

// A wet city at night as the early eighties imagined it: polysynth brass that swells and bends,
// electric piano in chorus, bell runs and one horn, all in a very large early digital hall.

export const PRESETS: readonly FactoryPreset[] = [
  // aurora: the big polysynth, brass first
  {
    id: 'neon-rain-flare-stack-brass',
    name: 'Flare stack brass',
    category: 'pad',
    description:
      'Polysynth brass that starts dark, opens past its tone and keeps swelling, in a cathedral-sized digital hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { brilliance: 1400, contour: 0.75, attack: 0.25, swell: 0.9, release: 5, detune: 10 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 60, mix: 0.25 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 7.5, damping: 5000, mix: 0.45 },
      },
      { deviceId: 'vintage-digital', preset: 'Soft glaze' },
    ],
  },
  {
    id: 'neon-rain-rooftop-swell',
    name: 'Rooftop swell',
    category: 'pad',
    description:
      'A brass chord that takes three seconds to open its filter, ridden by a slow compressor into a huge space.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 900, resonance: 0.35, attack: 3, release: 9, detune: 12, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { threshold: -26 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.85, decay: 18, highCut: 6000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'neon-rain-lone-ribbon-lead',
    name: 'Lone ribbon lead',
    category: 'pad',
    description:
      'One brass voice for a slow line: a quick filter overshoot, a wavering pitch, dark repeats and a long hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 1700,
        lowCut: 120,
        resonance: 0.35,
        contour: 0.7,
        attack: 0.08,
        swell: 0.5,
        release: 1.6,
        detune: 5,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Pitch wobble',
        params: { phase: 0, rate: 4.6, depth: 0.22, drift: 0.4 },
      },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 440, mix: 0.28 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { midDecay: 5, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'neon-rain-low-brass-pedal',
    name: 'Low brass pedal',
    category: 'pad',
    description:
      'The polysynth brass an octave under itself with the filter held low: a dark pedal fifth on a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 520,
        lowCut: 30,
        contour: 0.5,
        attack: 1.2,
        swell: 0.8,
        release: 6,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5, filter: 600 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.5, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'neon-rain-searchlight-sweep',
    name: 'Searchlight sweep',
    category: 'pad',
    description:
      'Each chord opens with a falling ring-modulator sweep that melts into brass, through a slow flanger and a hall.',
    instrument: {
      deviceId: 'aurora',
      params: { brilliance: 2200, contour: 0.4, attack: 0.1, swell: 0.5, release: 7, ring: 0.7 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { feedback: 20, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 9, size: 1.6, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-high-rise-strings',
    name: 'High rise strings',
    category: 'pad',
    description:
      'The string side of the polysynth: two detuned layers with the filter open, in an ensemble chorus and a very long hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 6000, attack: 1.4, release: 5, detune: 16, volume: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { spread: 30, mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.35, mix: 0.3 } },
    ],
  },

  // dusk: the second polysynth, for beds, a sequenced bass and a whistle
  {
    id: 'neon-rain-wet-pavement-pad',
    name: 'Wet pavement pad',
    category: 'pad',
    description:
      'Saw and moving pulse under both choruses, soft on top, in a cathedral heard through twelve-bit converters.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { cutoff: 1800, attack: 1.2, release: 5, chorus: 3, volume: -12.5 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { midDecay: 7, mix: 0.4 } },
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 14000 } },
    ],
  },
  {
    id: 'neon-rain-pulse-under-glass',
    name: 'Pulse under glass',
    category: 'pad',
    description:
      'A thin pulse whose width keeps moving, with no sub, turned slowly by a phaser in a very large space.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { cutoff: 2800, attack: 2, release: 6, volume: -10.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { feedback: 20, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.7, decay: 14, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-slow-filter-tower',
    name: 'Slow filter tower',
    category: 'pad',
    description:
      'A chord that begins almost shut and opens slowly as it is held, kept level into a ten-second hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 250, resonance: 0.35, envelope: 0.9, attack: 3.5, release: 9 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, size: 1.5, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-night-pursuit-bass',
    name: 'Night pursuit bass',
    category: 'keys',
    description:
      'A short sawtooth bass with a snapping filter, for a sequenced line: bucket-brigade repeats and a hall behind.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0.6,
        cutoff: 500,
        resonance: 0.3,
        envelope: 0.7,
        attack: 0.003,
        release: 0.3,
        chorus: 0,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 250, feedback: 0.4, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'neon-rain-whistle-down-the-block',
    name: 'Whistle down the block',
    category: 'pad',
    description:
      'The filter singing by itself, close to a sine whistle, for one slow line with chorused echoes in a plain hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.4, release: 3, chorus: 2, volume: -10.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 480, mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 7, size: 0.8, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'neon-rain-basement-generator',
    name: 'Basement generator',
    category: 'pad',
    description:
      'Square wave and full sub octave with the filter low: a dark, steady floor on clean tape and a long plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 500, attack: 1.5, release: 5, chorus: 0, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, hiss: 0.05 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.5, mix: 0.22 } },
    ],
    preview: 'low',
  },

  // tine-piano: the electric piano, always in chorus and a hall
  {
    id: 'neon-rain-rainy-window-keys',
    name: 'Rainy window keys',
    category: 'keys',
    description:
      'A soft tine electric piano with its tremolo off, through a two-voice chorus into a cathedral-sized hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0.55, decay: 1.4, release: 0.5, tremolo: 0, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.6, mix: 0.45 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { lowDecay: 6, midDecay: 7, damping: 4500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'neon-rain-bell-tine-echoes',
    name: 'Bell tine echoes',
    category: 'keys',
    description:
      'All bell and little bark, doubled a few cents wide, with dark repeats trailing into a huge space.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { release: 0.6, volume: -13.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide' },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 420, mix: 0.25 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.75, decay: 12, mix: 0.35 } },
    ],
  },
  {
    id: 'neon-rain-late-shift-tines',
    name: 'Late shift tines',
    category: 'keys',
    description:
      'Dark, round tines with hardly any bell, in a deep slow chorus, levelled and left on a long plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.15, decay: 1.8, release: 0.8, tone: 0.3, volume: -12.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { depth: 60, feedback: 10, mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.45, mix: 0.35 } },
    ],
  },
  {
    id: 'neon-rain-passing-headlights',
    name: 'Passing headlights',
    category: 'keys',
    description:
      'Tines that cross slowly from side to side, glazed by early converters, in an eight-second hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremoloRate: 0.35, volume: -16.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, size: 1.5, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-lounge-phaser-tines',
    name: 'Lounge phaser tines',
    category: 'keys',
    description:
      'A tine electric piano with some bark, through a slow four-stage phaser, a short tape echo and a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bark: 0.55, tremolo: 0, drive: 0.3, volume: -10.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.18, mix: 0.45 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 330, mix: 0.22 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-tines-and-strings',
    name: 'Tines and strings',
    category: 'keys',
    description:
      'Long-ringing tines with a soft string section swelling in behind each chord, in a very long hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { decay: 3.5, release: 2, tremolo: 0, volume: -14 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle Widener' },
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 2, mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // horns: one lonely horn, and brass a long way off
  {
    id: 'neon-rain-lonely-flugelhorn',
    name: 'Lonely flugelhorn',
    category: 'wind',
    description:
      'One flugelhorn with breath and a slow vibrato, its dark repeats falling away into a cathedral-sized hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.4, vibrato: 0.35, attack: 0.2, release: 1.8, volume: -2.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 460, mix: 0.25 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { preDelay: 100, midDecay: 8, mix: 0.45 },
      },
    ],
  },
  {
    id: 'neon-rain-muted-horn-back-alley',
    name: 'Muted horn, back alley',
    category: 'wind',
    description:
      'A thin muted trumpet played out of a horn loudspeaker down the street, with tape repeats in a huge space.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.12, release: 1.2, vibrato: 0.25, volume: -10 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { noise: 0.05 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 400, mix: 0.25 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, mix: 0.3 } },
    ],
  },
  {
    id: 'neon-rain-horns-over-the-basin',
    name: 'Horns over the basin',
    category: 'wind',
    description:
      'A horn section that swells in and brightens as it grows, held level in a cathedral glazed by early converters.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.7, section: 0.8, attack: 2, release: 5, volume: -9 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 7, mix: 0.45 },
      },
      { deviceId: 'vintage-digital', preset: 'Soft glaze' },
    ],
    preview: 'chord',
  },
  {
    id: 'neon-rain-foundry-low-brass',
    name: 'Foundry low brass',
    category: 'wind',
    description:
      'Trombones and tuba rising slowly on a low fifth, dark and heavy, in a very long hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.5, attack: 3, release: 7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000, lowCut: 30 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.4, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'neon-rain-distant-fanfare',
    name: 'Distant fanfare',
    category: 'wind',
    description:
      'A trumpet section that speaks in a third of a second, widened a little and set far back in a nine-second hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.6, attack: 0.3, release: 2.5, volume: -3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle Widener' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 9, size: 1.7, mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'neon-rain-horn-in-fifths',
    name: 'Horn in fifths',
    category: 'wind',
    description:
      'A soft french horn shadowed a fifth above, for a slow line, washed by a wide flanger on a long plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: {
        type: 0,
        blow: 0.5,
        breath: 0.3,
        attack: 0.6,
        release: 2.5,
        vibrato: 0.1,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide Wash', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // modal-bells: glitter runs, a tower bell, a gong in the smog
  {
    id: 'neon-rain-neon-glitter-bars',
    name: 'Neon glitter bars',
    category: 'bell',
    description:
      'Hard bright chime bars whose notes come back as quick rising octaves, a glitter run into a cathedral.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 4, hardness: 0.9, brightness: 0.85, spread: 0.7, volume: -2.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 110, repeats: 6, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 7000, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-tower-bell-wet-air',
    name: 'Tower bell, wet air',
    category: 'bell',
    description:
      'A heavy cast bell struck hard and left to ring on and on, glazed, across a very large modulated space.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 18, hardness: 0.6, brightness: 0.55, volume: -7.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { jitter: 0.2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.8, decay: 16, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-smog-gong',
    name: 'Smog gong',
    category: 'bell',
    description:
      'A large gong struck low, with a slowed copy an octave under it, long and heavy in a fourteen-second hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { damping: 0.35, hardness: 0.7, brightness: 0.7, spread: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { highCut: 1800, mix: 0.35 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 14, damping: 0.6, size: 1.8, mix: 0.45 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'neon-rain-lobby-vibraphone',
    name: 'Lobby vibraphone',
    category: 'bell',
    description:
      'Soft vibraphone bars with the pedal down, in a wide chorus, with dark repeats and a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { hardness: 0.25, release: 0.3, spread: 0.4, volume: -1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide Chorus', params: { rate: 0.5, mix: 0.4 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 500, feedback: 0.35, mix: 0.22 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'neon-rain-rubbed-glass-halo',
    name: 'Rubbed glass halo',
    category: 'bell',
    description:
      'Glass rims rubbed until they sing, for one slow line, with a faint halo an octave above in a long tail.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { decay: 10, detune: 1.2, sustain: 1, brightness: 0.35, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 10, shimmer: 0.25, size: 0.8, tone: 5000, mix: 0.4 },
      },
    ],
    preview: 'line',
  },
  {
    id: 'neon-rain-night-market-kalimba',
    name: 'Night market kalimba',
    category: 'bell',
    description:
      'A thumb piano as an early sampler plays it back, grainy and narrow, with repeats jumping a fifth in a hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 3, hardness: 0.7, brightness: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35, noise: 0.1 } },
      {
        deviceId: 'analog-delay',
        preset: 'Fifths and fourths',
        params: { time: 360, feedback: 0.45, intervalB: 0, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.4 } },
    ],
  },

  // fm-glass: the digital keyboard, its bells and its glass pads
  {
    id: 'neon-rain-clean-operator-keys',
    name: 'Clean operator keys',
    category: 'keys',
    description:
      'An FM electric piano, cleaner and thinner than the real tines, in a two-voice chorus and a four-second hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { brightness: 0.4, decay: 2.2, release: 0.9, detune: 6, volume: -5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.5, depth: 50, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, midDecay: 4, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-rain-on-neon',
    name: 'Rain on neon',
    category: 'bell',
    description:
      'Short bright FM chimes scattered into grains an octave up, each repeat climbing, in a huge bright space.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { brightness: 0.55, decay: 1.1, release: 2.5, volume: -3 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 260, spray: 0.3, feedback: 0.5, mix: 0.3 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.7, decay: 12, highCut: 9000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'neon-rain-skyline-crystal-pad',
    name: 'Skyline crystal pad',
    category: 'pad',
    description:
      'A held FM pad that arrives slowly and brightens after, doubled a few cents wide in a very long hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { attack: 2, release: 6, spread: 0.4, volume: -20.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo', params: { width: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'neon-rain-advert-chime',
    name: 'Advert chime',
    category: 'bell',
    description:
      'A clear FM bell whose repeats hop up an octave, heard over a small loudspeaker like an advert passing overhead.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 5, brightness: 0.5, decay: 3, spread: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hops', params: { feedback: 0.45, mix: 0.25 } },
      { deviceId: 'radio', preset: 'Clean transistor', params: { bandwidth: 0.8, mix: 0.7 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-elevator-vibes',
    name: 'Elevator vibes',
    category: 'bell',
    description:
      'Soft FM mallets under a gentle tremolo that leans from side to side, glazed by early converters on a plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { brightness: 0.25, decay: 3, release: 2, volume: -5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 2.6, depth: 0.4, phase: 120 },
      },
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 12000, jitter: 0.2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'neon-rain-deep-bowl-long-dark',
    name: 'Deep bowl, long dark',
    category: 'bell',
    description:
      'A large FM bowl with a soft strike, its tail sinking an octave and darkening for a long time.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { brightness: 0.3, decay: 12, release: 10, volume: -9 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.45, width: 0.45 } },
    ],
    preview: 'hold',
  },

  // string-machine: the string ensemble keyboard, soft and far back
  {
    id: 'neon-rain-soft-ensemble-strings',
    name: 'Soft ensemble strings',
    category: 'string',
    description:
      'The string ensemble keyboard with a soft bow and its chorus full on, in a cathedral heard through old converters.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 0.9, release: 3.5, tone: 3600, ensemble: 1, drift: 0.35, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { midDecay: 7.5, damping: 4500, mix: 0.45 },
      },
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 15000 } },
    ],
  },
  {
    id: 'neon-rain-low-cloud-strings',
    name: 'Low cloud strings',
    category: 'string',
    description:
      'Strings that arrive slowly with the top rolled off, dark and wide in a very large space.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { tone: 1500, width: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.8, decay: 16, highCut: 5000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'neon-rain-high-wire-strings',
    name: 'High wire strings',
    category: 'string',
    description:
      'The ensemble with no low octave and the top one full, thin and high, turned by a slow six-stage phaser in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.6, release: 5, tone: 9000, volume: -8.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 1800, mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 8, damping: 0.25, size: 1.5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'neon-rain-underpass-cellos',
    name: 'Underpass cellos',
    category: 'string',
    description:
      'The low octave of the ensemble alone on a low fifth, warmed by soft saturation, dark on a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.4, release: 4, tone: 1000, volume: -5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 6, outputDb: -3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.5, mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'neon-rain-short-string-stabs',
    name: 'Short string stabs',
    category: 'string',
    description:
      'The ensemble with a fast bow and a short release, for struck chords, with dark repeats in a big hall.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 0.02, release: 0.5, low: 0.3, high: 0.5, tone: 4500, ensemble: 0.7 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.4, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, midDecay: 4, mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'neon-rain-singing-hall-strings',
    name: 'Singing hall strings',
    category: 'string',
    description:
      'Plain sawtooth strings with the ensemble chorus nearly off, swelling slowly into a hall whose tail sings a wordless ah.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 2.2,
        release: 5,
        low: 0.15,
        high: 0.6,
        tone: 5000,
        ensemble: 0.25,
        speed: 0.6,
        drift: 0.5,
        volume: -11.5,
      },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Cathedral choir',
        params: { decay: 12, resonance: 0.65, mix: 0.5 },
      },
    ],
  },

  // felt-piano: an old piano a little out of tune, in the same huge hall
  {
    id: 'neon-rain-old-upright-new-city',
    name: 'Old upright, new city',
    category: 'keys',
    description:
      'A piano with its unisons well out of tune, lightly flanged, alone on the stage of a cathedral-sized hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.3,
        hardness: 0.45,
        detune: 0.85,
        reverbMix: 0,
        polyphony: 16,
        outputDb: -13,
      },
    },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Gentle Sweep',
        params: { rate: 0.15, feedback: 15, mix: 0.22 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-soft-pedal-far-hall',
    name: 'Soft pedal, far hall',
    category: 'keys',
    description:
      'The piano under its soft pedal with thick felt, drifting in a slow chorus, set far back in a huge space.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.85,
        hardness: 0.25,
        soft: 1,
        resonance: 0.3,
        reverbMix: 0,
        polyphony: 16,
        outputDb: -10,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 60, mix: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.8, decay: 14, highCut: 5500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'neon-rain-bare-piano-glazed',
    name: 'Bare piano, glazed',
    category: 'keys',
    description:
      'The piano with its felt lifted and a hard hammer, read through twelve-bit converters into a seven-second hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.7,
        detune: 0.6,
        reverbMix: 0,
        width: 0.7,
        polyphony: 16,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 13000 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, size: 1.5, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-piano-string-shadow',
    name: 'Piano, string shadow',
    category: 'keys',
    description:
      'A felted piano with a quiet string section that rises behind each chord and hangs on after, on a long plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { detune: 0.65, resonance: 0.3, reverbMix: 0, polyphony: 16, outputDb: -12.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Long shadow', params: { fall: 12, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'neon-rain-low-piano-toll',
    name: 'Low piano toll',
    category: 'keys',
    description:
      'Hard low piano notes with a slowed copy an octave below them, tolling in a very long hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.8,
        thump: 0.5,
        resonance: 0.3,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -17,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.45, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'neon-rain-apartment-piano',
    name: 'Apartment piano',
    category: 'keys',
    description:
      'A close, felted piano with its action noise, on quarter-inch tape, with a faint dark echo and a hall behind.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { detune: 0.7, action: 0.55, reverbMix: 0, polyphony: 16, outputDb: -15.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 520, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // acoustic-guitar: a guitar in chorus, far back
  {
    id: 'neon-rain-stairwell-nylon',
    name: 'Stairwell nylon',
    category: 'plucked',
    description:
      'A nylon-string guitar played with the fingertip, in a two-voice chorus, small in a cathedral-sized hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.3, sustain: 7, release: 3, volume: 2.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.5, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-twelve-string-drizzle',
    name: 'Twelve string drizzle',
    category: 'plucked',
    description:
      'A picked twelve-string doubled a few cents wide, its chorused echoes scattering into a seven-second hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { tone: 0.7, strum: 40, volume: 0 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { mix: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 340, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, size: 1.4, mix: 0.35 } },
    ],
  },

  // atmosphere: the weather and the signs
  {
    id: 'neon-rain-roof-glass-rain',
    name: 'Roof glass rain',
    category: 'texture',
    description:
      'Steady heavy rain heard from under a glass roof, levelled by a limiter and set in a hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: {
        density: 0.85,
        tone: 0.5,
        size: 0.6,
        attack: 2,
        release: 5,
        width: 0.5,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', preset: 'Drive', params: { inputGain: 22, outputGain: -8 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'neon-rain-neon-tube-hum',
    name: 'Neon tube hum',
    category: 'texture',
    description:
      'Mains hum tuned to the key held, flickering at random like a failing sign tube, in a small dark room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: {
        density: 0.55,
        movement: 0.6,
        tone: 0.5,
        resonance: 0.35,
        attack: 0.4,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 9, depth: 0.35, shape: 3, smooth: 0.1 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 5000, mix: 0.3 } },
    ],
  },

  // bowed-string: a held wire and a cello under the street
  {
    id: 'neon-rain-held-wire-lead',
    name: 'Held wire lead',
    category: 'string',
    description:
      'One string held singing with no bow and a slow vibrato, for a line, with dark repeats in a cathedral.',
    instrument: {
      deviceId: 'bowed-string',
      params: { attack: 0.6, release: 2.5, brightness: 0.55, vibrato: 0.3, vibratoRate: 4.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.4, spread: 30, mix: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 480, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'neon-rain-parking-level-cello',
    name: 'Parking level cello',
    category: 'string',
    description:
      'A bowed cello on a low fifth with a heavy bow and little vibrato, on tape, dark in a very large space.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1.5, release: 3, pressure: 0.6, vibrato: 0.1, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.12 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.8, decay: 14, highCut: 4000, mix: 0.4, width: 0.7 },
      },
    ],
    preview: 'low',
  },

  // chamber-strings: real bows, as a sampler or a wide chorus leaves them
  {
    id: 'neon-rain-twelve-bit-section',
    name: 'Twelve-bit section',
    category: 'string',
    description:
      'A muted string section swelling in slowly, as an early sampler would hold it, grainy in a cathedral.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 1.8, mute: 0.8, scatter: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 11000, jitter: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'neon-rain-late-full-section',
    name: 'Late full section',
    category: 'string',
    description:
      'Six players to a note with a wide vibrato and no mutes, thickened by an ensemble chorus on a long plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 1, release: 2.5, width: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { spread: 40, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // choir: a choir from a chip, and one singer a long way off
  {
    id: 'neon-rain-choir-from-a-chip',
    name: 'Choir from a chip',
    category: 'voice',
    description:
      'A straight-toned choir on ah, read back through worn nine-bit converters and left in a huge space.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0.15,
        ensemble: 0.9,
        vibrato: 0,
        attack: 1.4,
        release: 4,
        tone: 5000,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn converter', params: { jitter: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.75, decay: 14, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-wordless-voice-far',
    name: 'Wordless voice, far',
    category: 'voice',
    description:
      'One high voice with a wide vibrato and no words, for a slow line, with dark repeats in a cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.05,
        voice: 1.3,
        breath: 0.25,
        vibrato: 26,
        attack: 0.25,
        release: 1.2,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 500, mix: 0.22 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { preDelay: 100, midDecay: 7, damping: 5000, mix: 0.5 },
      },
    ],
    preview: 'line',
  },

  // chord-harp: sweeps
  {
    id: 'neon-rain-slow-chord-sweep',
    name: 'Slow chord sweep',
    category: 'plucked',
    description:
      'Each chord swept slowly up and back down four octaves of soft strings, in a wide chorus and a huge space.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { tone: 0.45, volume: -3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide Chorus', params: { rate: 0.5, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.7, decay: 12, mix: 0.35 } },
    ],
  },
  {
    id: 'neon-rain-shop-sign-sparkle',
    name: 'Shop sign sparkle',
    category: 'plucked',
    description:
      'Quick strums in random order over a soft pad of the same chord, glazed by early converters in a plain hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { sustain: 2.5, tone: 0.75, pad: 0.45, volume: -11.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glass images', params: { rate: 12000 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 6, size: 0.7, mix: 0.35 } },
    ],
  },

  // clarinet: the saxophone after hours
  {
    id: 'neon-rain-saxophone-after-hours',
    name: 'Saxophone after hours',
    category: 'wind',
    description:
      'A subtone tenor that is mostly breath, with a slow vibrato, dark repeats behind it and a cathedral-sized hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.25, breath: 0.8, attack: 0.2, release: 0.8, vibrato: 0.45, volume: -6 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 430, mix: 0.22 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Cathedral',
        params: { preDelay: 90, midDecay: 7.5, mix: 0.45 },
      },
    ],
  },
  {
    id: 'neon-rain-reed-in-the-market',
    name: 'Reed in the market',
    category: 'wind',
    description:
      'A soft double reed with a deep vibrato, repeated by three tape heads and lost in a seven-second hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 0.3, release: 0.9, vibrato: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 480, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, size: 1.4, mix: 0.4 } },
    ],
  },

  // drone: the plain beyond the towers
  {
    id: 'neon-rain-industrial-plain',
    name: 'Industrial plain',
    category: 'drone',
    description:
      'A dark just-minor drone with a strong sub, turned very slowly by an eight-stage phaser in a thirty-second space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { attack: 4, cutoff: 800, volume: -8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep 8-Stage',
        params: { rate: 0.05, feedback: 40, mix: 0.3 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.85, decay: 30, highCut: 4500, mix: 0.4, width: 0.7 },
      },
    ],
  },
  {
    id: 'neon-rain-reactor-floor',
    name: 'Reactor floor',
    category: 'drone',
    description:
      'Stacked low octaves over a heavy sub, slow to move, pushed through a transformer for some growl, on a damped long plate.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { movement: 0.5, cutoff: 500, attack: 3, width: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6, lowBump: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.22 } },
    ],
  },

  // ember: a lead that bends, and something passing overhead
  {
    id: 'neon-rain-bending-night-lead',
    name: 'Bending night lead',
    category: 'pad',
    description:
      'A one-voice brass lead that slides from note to note with a light vibrato, doubled a few cents apart, with tape repeats in a cathedral.',
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        cutoff: 1100,
        filterEnvAmount: 0.5,
        filterAttack: 0.25,
        filterDecay: 0.8,
        ampAttack: 0.05,
        ampRelease: 1.2,
        lfo2Rate: 4.8,
        lfo2Amount: 0.012,
        voiceMode: 2,
        glide: 0.35,
        unisonVoices: 2,
        unisonDetune: 10,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { detune: 12, mix: 0.3 } },
      { deviceId: 'tape-echo', params: { time: 470, feedback: 0.4, spread: 0.5, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { preDelay: 100, mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'neon-rain-cruiser-overhead',
    name: 'Cruiser overhead',
    category: 'texture',
    description:
      'Filtered noise that sweeps up over two seconds and back, through a jet flanger, passing across a huge space.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        resonance: 0.45,
        filterEnvAmount: 0.85,
        filterAttack: 2.5,
        filterDecay: 3,
        ampAttack: 1,
        ampRelease: 3,
        lfo2Rate: 0.12,
        lfo2Dest: 3,
        lfo2Amount: 0.6,
        velToAmp: 0.2,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Classic Jet', params: { rate: 0.12, mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.8, decay: 12, mix: 0.4 } },
    ],
  },

  // flute: bamboo in the market, breath from a vent
  {
    id: 'neon-rain-bamboo-flute-in-steam',
    name: 'Bamboo flute in steam',
    category: 'wind',
    description:
      'A bamboo flute that scoops up into each note with a hard chiff, a short tape echo and a cathedral behind it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.7, release: 1, vibrato: 0.5, scoop: 140, volume: -12 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 380, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'neon-rain-steam-vent-breath',
    name: 'Steam vent breath',
    category: 'wind',
    description:
      'Low flutes that are nearly all air and slow to speak, held as a chord and drifting in a very large space.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 2, release: 4, vibrato: 0.1, volume: -15 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.7, decay: 12, mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // grain-synth: whatever is loaded, treated like the rest
  {
    id: 'neon-rain-grain-cloud-in-chorus',
    name: 'Grain cloud in chorus',
    category: 'pad',
    description:
      'Whatever is loaded, as a soft cloud of grains that fades in, in an ensemble chorus and a cathedral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Cloud',
      params: { size: 340, attack: 1.2, release: 4, tone: 7000, volume: -13.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-glitter-from-a-sample',
    name: 'Glitter from a sample',
    category: 'pad',
    description:
      'Whatever is loaded, scattered into grains with octaves above, glazed by early converters in a huge space.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: { size: 220, density: 12, octaves: 0.7, attack: 0.8, spread: 0.8, volume: -19 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 14000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.7, decay: 10, mix: 0.35 } },
    ],
  },

  // guitar: clean, in chorus
  {
    id: 'neon-rain-clean-chorus-guitar',
    name: 'Clean chorus guitar',
    category: 'plucked',
    description:
      'A clean neck pickup in a three-voice chorus with dark bucket-brigade repeats and a hall, for slow arpeggios.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.5, sustain: 11, volume: 3.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar Shimmer', params: { rate: 0.7, mix: 0.45 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 390, feedback: 0.4, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
  },
  {
    id: 'neon-rain-swelled-guitar-chord',
    name: 'Swelled guitar chord',
    category: 'pad',
    description:
      'A guitar chord with every pick taken off by the volume pedal, lifted, doubled thick and wide, in a huge space.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { swell: 1.5, tone: 2800 } },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 7 } },
      { deviceId: 'stereo-detune', preset: 'Thick double', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.75, decay: 14, mix: 0.4 } },
    ],
  },

  // handpan: slowed to a boom, or glazed
  {
    id: 'neon-rain-slow-steel-boom',
    name: 'Slow steel boom',
    category: 'bell',
    description:
      'A steel pan struck firmly, with a copy at half speed an octave down: a dark boom in a ten-second hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 7, touch: 0.5, shimmer: 0.15, cavity: 1, volume: -4 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Continuous octave',
        params: { highCut: 2500, spread: 0.4, mix: 0.55 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 10, damping: 0.55, size: 1.7, mix: 0.4 },
      },
    ],
    preview: 'keys',
  },
  {
    id: 'neon-rain-glazed-tongue-drum',
    name: 'Glazed tongue drum',
    category: 'bell',
    description:
      'A steel tongue drum touched softly, read through twelve-bit converters, with dark repeats in a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 6, touch: 0.2, volume: -2.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 10000, jitter: 0.2 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 400, feedback: 0.4, mix: 0.22 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
  },

  // harp: a sweep under the ironwork, and a koto off a disk
  {
    id: 'neon-rain-atrium-harp-sweep',
    name: 'Atrium harp sweep',
    category: 'plucked',
    description:
      'A concert harp where each key sets off a glissando up the strings, widened a little, in a cathedral-sized hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { touch: 0.5, halo: 0.9, volume: -1.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle Widener' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 6000, mix: 0.45 } },
    ],
  },
  {
    id: 'neon-rain-rising-koto-sampled',
    name: 'Rising koto, sampled',
    category: 'plucked',
    description:
      'A koto whose notes are pressed up a semitone after the pluck, grainy off an early sampler, echoing in a hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: { pluck: 0.14, touch: 0.45, decay: 2.5, volume: 1.5 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Early sampler',
        params: { drive: 0.7, wobble: 0.05, wear: 0.5, noise: 0.08 },
      },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 450, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, size: 1.4, mix: 0.4 } },
    ],
  },

  // ladder-bass: a pedal note and a lead that glides
  {
    id: 'neon-rain-phased-pedal-bass',
    name: 'Phased pedal bass',
    category: 'keys',
    description:
      'Two beating oscillators and a sub held as a dark pedal note, its top turned by a phaser, on a long plate.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 8, cutoff: 420, drive: 0.25, volume: -12 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass Safe', params: { rate: 0.15, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.5, mix: 0.22 } },
    ],
    preview: 'low',
  },
  {
    id: 'neon-rain-gliding-mono-lead',
    name: 'Gliding mono lead',
    category: 'keys',
    description:
      'A one-voice ladder-filter lead that slides a quarter of a second between notes, with chorused echoes in a cathedral.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: { cutoff: 1300, emphasis: 0.4, glide: 0.25, volume: -2 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 450, mix: 0.28 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },

  // mallets: small bright bars
  {
    id: 'neon-rain-glockenspiel-run',
    name: 'Glockenspiel run',
    category: 'bell',
    description:
      'A hard-struck glockenspiel whose notes come back climbing by octaves and fifths, bright in a huge space.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { decay: 1.4, width: 0.5, volume: -4.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 180, repeats: 6, mix: 0.25 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.7, decay: 10, highCut: 9000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'neon-rain-clockwork-celesta',
    name: 'Clockwork celesta',
    category: 'bell',
    description:
      'A celesta played softly and left to ring a little, with chorused echoes trailing into a cathedral-sized hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { decay: 1.5, damper: 0.3, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 360, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // organ: pipes a long way off, flutes in a turning speaker
  {
    id: 'neon-rain-pipes-over-rooftops',
    name: 'Pipes over rooftops',
    category: 'organ',
    description:
      'Dark organ pipes that are slow to speak, glazed by early converters, in a very long hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 2, release: 6, tone: 1000, volume: -14 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 13000 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'neon-rain-slow-rotor-flutes',
    name: 'Slow rotor flutes',
    category: 'organ',
    description:
      'Flute ranks with no reed, through a rotating speaker on its slow speed heard across the room, in a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.2, release: 1.2, tone: 4000, volume: -12.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.6, spread: 0.8 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.4 } },
    ],
  },

  // outdoors: thunder and a balcony
  {
    id: 'neon-rain-thunder-past-the-towers',
    name: 'Thunder past the towers',
    category: 'texture',
    description:
      'Far thunder rolling while a key is held, the rumble kept and the top rolled off, in a ten-second space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.65, distance: 0.7, volume: -2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { lowCut: 28, highCut: 7000 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.8, decay: 10, lowCut: 30, mix: 0.3 },
      },
    ],
  },
  {
    id: 'neon-rain-balcony-wind-chimes',
    name: 'Balcony wind chimes',
    category: 'bell',
    description:
      'Wind chimes tuned to the chord held, stirred by a gusting breeze, with dark repeats in a plain long hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.6, distance: 0.3, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 420, mix: 0.2 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 6, size: 0.7, mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // pedal-steel: the bend
  {
    id: 'neon-rain-sliding-steel-line',
    name: 'Sliding steel line',
    category: 'plucked',
    description:
      'A steel guitar whose held note is bent by the next one, swelled in with a wide vibrato, through three springs into a huge space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { glide: 250, range: 5, vibrato: 20, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Long three spring',
        params: { drip: 0.2, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.8, decay: 14, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'neon-rain-still-steel-far-tower',
    name: 'Still steel, far tower',
    category: 'plucked',
    description:
      'Steel strings swelled in with no vibrato, ringing on as a chord, glazed by early converters, in a huge space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { tone: 2200, volume: -13 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 13000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.8, decay: 16, mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // sampler: whatever is loaded, as the first samplers gave it back
  {
    id: 'neon-rain-first-sampler-keys',
    name: 'First sampler keys',
    category: 'keys',
    description:
      'Whatever is loaded, played back as the first samplers did, eight bits companded at a low rate, in a hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { attack: 0.01, release: 1.2, wobble: 0.1, volume: -15 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Eight bit toy',
        params: { rate: 9000, aliasing: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-octave-down-loop-pad',
    name: 'Octave-down loop pad',
    category: 'pad',
    description:
      'Whatever is loaded, looped an octave down under a low-pass filter that opens and closes slowly, in a huge space.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.2, release: 4, wobble: 0.35, volume: -14 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 900, resonance: 1.5, lfoAmount: 45, lfoRateHz: 0.09 },
      },
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.75, decay: 14, mix: 0.4 } },
    ],
  },

  // tanpura: a drone wire, plain or buzzing
  {
    id: 'neon-rain-four-plain-wires',
    name: 'Four plain wires',
    category: 'drone',
    description:
      'Four strings plucked round and round with the buzz taken off, in a deep slow chorus and a very large space.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 7, body: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { depth: 60, feedback: 10, mix: 0.35 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.8, decay: 16, mix: 0.4, width: 0.8 },
      },
    ],
  },
  {
    id: 'neon-rain-bridge-buzz-slow-sweep',
    name: 'Bridge buzz, slow sweep',
    category: 'drone',
    description:
      'The drone lute with its bridge buzzing hard, every pluck blooming into overtones, swept by a slow flanger in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { speed: 8, spread: 0.6, volume: -1 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { rate: 0.05, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, size: 1.6, mix: 0.4 } },
    ],
  },

  // tape-orchestra: the tape-replay keyboard, already old in this city
  {
    id: 'neon-rain-tape-strip-choir',
    name: 'Tape strip choir',
    category: 'voice',
    description:
      'A choir from a strip of tape under each key, a little unsteady, drifting in chorus in a cathedral-sized hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { age: 0.3, attack: 0.4, release: 1.6, volume: -10 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 60, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'neon-rain-hissing-slow-horns',
    name: 'Hissing slow horns',
    category: 'wind',
    description:
      'Horns from tape run at half speed, an octave down and slow to speak, hissing a little, dark in a huge space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { tone: 0.1, attack: 1.1, release: 2.5, volume: -11.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.8, decay: 14, highCut: 5000, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },

  // thesis: air through the steel
  {
    id: 'neon-rain-wind-through-girders',
    name: 'Wind through girders',
    category: 'pad',
    description:
      'Noise through narrow tuned bands that breathe slowly, a whistling chord of air, lifted and left in a cathedral.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 70, attack: 2, release: 5 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 12, outputGain: -3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'hold',
  },
  {
    id: 'neon-rain-vent-shaft-drone',
    name: 'Vent shaft drone',
    category: 'drone',
    description:
      'Wide bands of noise low down that drift in pitch, a rush of air on a low fifth in a very large space.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { attack: 2.5, release: 7 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.85, decay: 20, highCut: 4000, mix: 0.4, width: 0.7 },
      },
    ],
  },

  // wavetable: a table of vowels, a hollow one
  {
    id: 'neon-rain-vowel-table-choir',
    name: 'Vowel table choir',
    category: 'pad',
    description:
      'A wavetable of vowels moving slowly from one to the next, read through twelve-bit converters in a cathedral.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        rate: 0.07,
        detune: 10,
        cutoff: 5000,
        attack: 2,
        release: 5,
        spread: 0.5,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 12000, jitter: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'neon-rain-hollow-tower-pad',
    name: 'Hollow tower pad',
    category: 'pad',
    description:
      'A hollow wavetable with the filter low that arrives slowly, in a deep slow chorus on a long plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { cutoff: 1100, spread: 0.6, volume: -8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { depth: 60, feedback: 10, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.45, mix: 0.3 } },
    ],
  },

  // west-coast: the machines thinking
  {
    id: 'neon-rain-console-beeps',
    name: 'Console beeps',
    category: 'bell',
    description:
      'Bright beeps that strike and hold while the key is down, the tone changing by chance, echoing quickly in a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: {
        fm: 0.4,
        ratio: 5,
        decay: 0.25,
        sustain: 0.5,
        colour: 0.9,
        chance: 0.6,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 12, outputGain: -2 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 180, feedback: 0.6, tone: 5000, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 3.5, mix: 0.45 } },
    ],
  },
  {
    id: 'neon-rain-slow-folding-pad',
    name: 'Slow folding pad',
    category: 'pad',
    description:
      'A pure tone that folds over into brightness as it swells in, in an ensemble chorus and a huge space.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.35, decay: 4, colour: 0.7, volume: -9 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { spread: 60, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.75, decay: 12, mix: 0.4 } },
    ],
  },

  // zither: hammered wire
  {
    id: 'neon-rain-hammered-wire-shimmer',
    name: 'Hammered wire shimmer',
    category: 'plucked',
    description:
      'A hammered dulcimer rolled in octaves so held notes shimmer, in a two-voice chorus and a cathedral-sized hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 8, brightness: 0.55, volume: -9 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.5, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'neon-rain-zither-in-the-haze',
    name: 'Zither in the haze',
    category: 'plucked',
    description:
      'Doubled courses picked in octaves and left to ring, turned by a slow phaser in an eight-second hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { decay: 10, brightness: 0.5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.08, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, size: 1.5, mix: 0.4 } },
    ],
  },
]
