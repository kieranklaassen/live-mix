import { type FactoryPreset } from '../types'

// Country instruments sent up into a slow orbit: steel that slides instead of twanging, guitars
// with the pick taken off, soft pads underneath, deep tremolo, one slap of echo and a long hall.

export const PRESETS: readonly FactoryPreset[] = [
  // Pedal steel: the voice of the pack. Volume-pedal swells, slow bar slides, slap and hall.
  {
    id: 'orbit-steel-earthrise-steel',
    name: 'Earthrise steel',
    category: 'plucked',
    description:
      'Pedal steel chords raised on the volume pedal over a second, with one slap of tape echo before a long hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 1.1,
        sustain: 24,
        glide: 380,
        vibrato: 6,
        rate: 4.4,
        pick: 0.25,
        tone: 2700,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 125,
          feedback: 0.15,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          highCut: 6000,
          spread: 0,
          mix: 0.25,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-long-bar-slide',
    name: 'Long bar slide',
    category: 'plucked',
    description:
      'One steel string that slides the whole way to each new note, doubled a few cents wide, in a long plate.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.5, glide: 650, vibrato: 10, rate: 4, pick: 0.3, volume: -5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-low-steel-halo',
    name: 'Low steel halo',
    category: 'plucked',
    description:
      'A still low fifth on the bottom strings, faded in over two seconds, under a reverb that climbs an octave on every pass.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 2, pick: 0.2, tone: 2800, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { mix: 0.45, decay: 10, shimmer: 0.4 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'orbit-steel-half-speed-steel',
    name: 'Half-speed steel',
    category: 'plucked',
    description:
      'Steel with its own playback at half speed under it, an octave down and twice as slow, on tape in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.3, sustain: 18, pick: 0.35, tone: 3000 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-tremolo-steel',
    name: 'Tremolo steel',
    category: 'plucked',
    description:
      'A singing steel lead with a wide bar vibrato, through a deep amp tremolo and a long spring tank.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.6, vibrato: 18, tone: 3300, volume: -7 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.6, depth: 0.85 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-steel-held-aloft',
    name: 'Steel held aloft',
    category: 'pad',
    description:
      'A steel chord caught and held as an even pad for as long as it likes, hanging in a very large space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.4, vibrato: 3, pick: 0.3, tone: 2600, volume: -11.5 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'orbit-steel-lap-slapback',
    name: 'Lap slapback',
    category: 'plucked',
    description:
      'A bright lap steel picked with no swell, one dark slap behind each note, through a small amp in a room.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { pick: 0.85, tone: 5400, volume: -6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 105, tone: 2400, mix: 0.35 },
      },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { treble: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-two-string-harmony',
    name: 'Two-string harmony',
    category: 'plucked',
    description:
      'A steel line with a third above and a sixth below found from the scale, as two more strings would play, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.5, vibrato: 8, rate: 4.6, pick: 0.35, volume: -2.5 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'orbit-steel-echo-thrown-steel',
    name: 'Echo-thrown steel',
    category: 'plucked',
    description:
      'Bright picked steel notes thrown into a dotted tape echo that feeds itself, with a driven spring behind.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { pick: 0.85, tone: 5000, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 750,
          feedback: 0.7,
          heads: 3,
          wow: 0.35,
          flutter: 0.2,
          drive: 0.5,
          lowCut: 180,
          highCut: 3000,
          spread: 1,
          mix: 0.4,
        },
      },
      {
        deviceId: 'spring-reverb',
        params: {
          mix: 0.25,
          decay: 3,
          tension: 0.35,
          tone: 2400,
          drip: 0.55,
          predelay: 60,
          drive: 0.7,
        },
      },
    ],
    preview: 'keys',
  },

  // Electric guitar: neck pickup, no pick to be heard, tremolo, slap echo and a detuned double.
  {
    id: 'orbit-steel-no-pick-heard',
    name: 'No pick heard',
    category: 'plucked',
    description:
      'Guitar chords with every pick removed by a slow swell, through a small amp, widened a few cents in a cathedral.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1.8, sustain: 22, tone: 2800, warmth: 0.6 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.15, noise: 0.05, output: 2.5 },
      },
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-small-amp-tremolo',
    name: 'Small amp tremolo',
    category: 'plucked',
    description:
      'A neck pickup into deep tremolo and a small combo with its spring on: slow notes that pulse as they die.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.95, hardness: 0.4, tone: 3200, warmth: 0.5, volume: 1 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 4.2, depth: 0.8 } },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-detuned-double-slap',
    name: 'Detuned double slap',
    category: 'plucked',
    description:
      'A clean guitar picked hard by the bridge, doubled nine cents either side, with one slap of tape echo and a plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.25, position: 0.09, hardness: 0.75, tone: 4600, warmth: 0.2, volume: 1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { mix: 0.45 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 140,
          feedback: 0.2,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          highCut: 6000,
          spread: 0.3,
          mix: 0.3,
        },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-far-side-baritone',
    name: 'Far side baritone',
    category: 'plucked',
    description:
      'Low strings by the bridge over the hum of the amp, through a slow uneven tremolo and a dark spring.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { hardness: 0.45, sustain: 26, tone: 1900, volume: -1.8 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -46 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.6, depth: 0.45 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark amp spring',
        params: { mix: 0.4, decay: 3, width: 1, springs: 1 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'orbit-steel-strum-into-octaves',
    name: 'Strum into octaves',
    category: 'plucked',
    description:
      'An open chord dragged across the strings into a reverb that keeps climbing by octaves after it.',
    instrument: { deviceId: 'guitar', preset: 'Slow strum', params: { strum: 75, hardness: 0.25 } },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { mix: 0.6, shimmer: 0.45, decay: 14 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-hallway-twelve-string',
    name: 'Hallway twelve-string',
    category: 'plucked',
    description:
      'A twelve-string recorded to tape and played back through an amp at the far end of a hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { strum: 40, volume: -0.6, hardness: 0.5, tone: 4200 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 're-amp', preset: 'Down the hall' },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-pedal-bowed-guitar',
    name: 'Pedal-bowed guitar',
    category: 'plucked',
    description:
      'Single guitar notes with the attack taken off by a pedal, each echoed three times into a hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.6, hardness: 0.6, sustain: 20, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 320 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'orbit-steel-endless-guitar-note',
    name: 'Endless guitar note',
    category: 'plucked',
    description:
      'A swelled guitar note pushed through a valve stage, caught and held without decay, dark repeats in a long plate.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { swell: 0.8, tone: 3400 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Glowing triode', params: { drive: 0.35, output: 5 } },
      {
        deviceId: 'sustainer',
        preset: 'Sustain pedal',
        params: { sensitivity: 0.8, decay: 30, mix: 0.55 },
      },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Acoustic guitar: thumb and fingers, never a hard pick, close on tape or dissolved.
  {
    id: 'orbit-steel-porch-thumb-guitar',
    name: 'Porch thumb guitar',
    category: 'plucked',
    description:
      'A steel-string played with the thumb alone, close and soft, on clean tape in a small wooden room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { volume: 1.5, position: 0.34, sustain: 5, strum: 30 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-nylon-turned-backwards',
    name: 'Nylon turned backwards',
    category: 'plucked',
    description:
      'Nylon chords heard backwards in long swells, each pluck arriving last, on tape in a very large space.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { body: 1, position: 0.36, nail: 0, sustain: 10, release: 6, volume: -4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1800, mix: 0.9 } },
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-twelve-string-sway',
    name: 'Twelve-string sway',
    category: 'plucked',
    description:
      'Twelve strings through a harmonic tremolo that sways bass against treble instead of pulsing, in a long plate.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { nail: 0.5, strum: 40, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Wide shimmer',
        params: { rate: 3.2, depth: 0.8, shape: 0, crossover: 800 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-open-strings-answer',
    name: 'Open strings answer',
    category: 'plucked',
    description:
      'Steel strings left to ring over a bank of tuned strings that answer every note, in a hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: -6.5, nail: 0.3, shimmer: 0.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Open triad', params: { root: 2, mode: 1, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-flat-top-slapback',
    name: 'Flat-top slapback',
    category: 'plucked',
    description:
      'A steel-string picked near the bridge with a single tape slap and a little spring, bright and close.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { nail: 0.6, position: 0.1, tone: 0.72, volume: -1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 115,
          feedback: 0.1,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          highCut: 7000,
          spread: 0,
          mix: 0.3,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-looped-fingerpicking',
    name: 'Looped fingerpicking',
    category: 'plucked',
    description:
      'Soft fingerpicking over a loop of what was just played, at half speed and darker, on worn reel tape in a hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { nail: 0.3, tone: 0.5, volume: 0.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { mix: 0.4 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-strings-rise-behind',
    name: 'Strings rise behind',
    category: 'plucked',
    description:
      'Slow nylon notes with a soft section pad that swells in on the same chord seconds later, in a plate.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.1, volume: 5.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 3, mix: 0.5 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },

  // Dusk: the soft chorus pads that lie under the steel.
  {
    id: 'orbit-steel-chorus-pad-bed',
    name: 'Chorus pad bed',
    category: 'pad',
    description:
      'The bed that sits under the steel: a chorus pad with the filter half shut, slow to speak, in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0.3, cutoff: 1100, envelope: 0.15, attack: 2.5, release: 5, volume: -10.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } }],
  },
  {
    id: 'orbit-steel-low-cabin-pad',
    name: 'Low cabin pad',
    category: 'pad',
    description:
      'Square wave over its sub octave with the filter half shut: a dark low pad to lay fifths on, on tape in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { sub: 0.4, cutoff: 1800, attack: 2, release: 6, chorus: 2, volume: -9.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'orbit-steel-slow-light-pad',
    name: 'Slow light pad',
    category: 'pad',
    description:
      'A chord whose filter takes four seconds to open from nearly shut, under both choruses, in a long plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 250, envelope: 0.9, attack: 4, release: 9, chorus: 3, volume: -12.5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'orbit-steel-thin-pulse-orbit',
    name: 'Thin pulse orbit',
    category: 'pad',
    description:
      'A thin pulse pad with its lows cut away, panned slowly from side to side across a very large space.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { lowCut: 3, cutoff: 5000, attack: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.2, depth: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, width: 0.8 } },
    ],
  },
  {
    id: 'orbit-steel-filter-sings-alone',
    name: 'Filter sings alone',
    category: 'pad',
    description:
      'The filter singing a near-sine two octaves above each key, with a bar-like vibrato, chorus echoes and a plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.5, release: 4, volume: -8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { phase: 0, rate: 4.5, depth: 0.25 } },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'orbit-steel-pad-in-tremolo',
    name: 'Pad in tremolo',
    category: 'pad',
    description:
      'A sawtooth pad treated like the guitar: deep tremolo at three and a half beats a second, then a long spring.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { wave: 0, sub: 0.2, cutoff: 2000, attack: 0.8, volume: -7 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.5, depth: 0.85 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'orbit-steel-struck-pad-loop',
    name: 'Struck pad loop',
    category: 'pad',
    description:
      'Short pad notes that start open and darken, played into a loop of tape between two decks, each pass quieter and more worn.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: {
        wave: 4,
        sub: 0.3,
        cutoff: 600,
        resonance: 0.2,
        envelope: 0.7,
        attack: 0.005,
        release: 1.8,
        chorus: 1,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 2.4, feedback: 0.6, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },

  // Tine piano: the soft electric piano with its tremolo, slowed, swelled and slapped.
  {
    id: 'orbit-steel-slow-sway-tines',
    name: 'Slow sway tines',
    category: 'keys',
    description:
      'A soft electric piano whose tremolo sways it slowly from side to side, widened a little, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremolo: 0.6, tremoloRate: 0.6, volume: -16 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'orbit-steel-tines-hammers-off',
    name: 'Tines, hammers off',
    category: 'keys',
    description:
      'Electric piano chords with the hammer faded out by a slow swell, so the tines seem bowed, in a long plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0, volume: -17 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-dark-tine-slap',
    name: 'Dark tine slap',
    category: 'keys',
    description:
      'Dark, round tines with one soft slap behind each note and a small amp spring, close and small.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { volume: -15, bark: 0.3, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 110, mix: 0.35, spread: 0.5 },
      },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark amp spring',
        params: { mix: 0.3, width: 1, springs: 1 },
      },
    ],
  },
  {
    id: 'orbit-steel-bell-tines-above',
    name: 'Bell tines above',
    category: 'keys',
    description:
      'Round bell tines struck one at a time, with a thin reverb two octaves up hanging over them.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { volume: -11.5, bell: 1, decay: 1.6, tremolo: 0 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } }],
    preview: 'bells',
  },
  {
    id: 'orbit-steel-deep-tremolo-tines',
    name: 'Deep tremolo tines',
    category: 'keys',
    description:
      'The electric piano with its own tremolo turned up deep and mono, through a small combo in a room: every note throbs.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremolo: 0.85, tremoloRate: 4.2, volume: -13.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'orbit-steel-slowed-tines',
    name: 'Slowed tines',
    category: 'keys',
    description:
      'Long tines heard mostly at half speed, an octave down and late, on tape in a very large space.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { volume: -16, bell: 0.5, tremolo: 0.1 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 2000, smooth: 0.9, mix: 0.8 },
      },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'orbit-steel-tines-long-memory',
    name: 'Tines, long memory',
    category: 'keys',
    description:
      'A soft electric piano on a worn cassette, with moments from the last minute of playing heard again under the echoes.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.4, hardness: 0.6, tremolo: 0.3, tone: 0.45, volume: -13.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'echo-memory', preset: 'Long memory' },
    ],
  },

  // Harp: plucked strings treated like the steel, rung long, swelled, bent and slapped.
  {
    id: 'orbit-steel-octave-strung-harp',
    name: 'Octave-strung harp',
    category: 'plucked',
    description:
      'Soft harp strings that ring long into each other, each with a second string an octave up, in a cathedral.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { volume: -9.5, touch: 0.2, decay: 2.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-harp-without-fingers',
    name: 'Harp without fingers',
    category: 'plucked',
    description:
      'Harp chords with the pluck swelled away and the ring doubled a few cents wide, in a long plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { touch: 0.2, decay: 2, halo: 0.8, volume: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 600 } },
      { deviceId: 'stereo-detune', preset: 'Classic wide' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-muted-harp-pattern',
    name: 'Muted harp pattern',
    category: 'plucked',
    description:
      'Short damped harp notes that three tape heads turn into a pattern, with a little spring behind.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: -3, damp: 0.7, touch: 0.4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 400, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-strings-pressed-sharp',
    name: 'Strings pressed sharp',
    category: 'plucked',
    description:
      'Silk strings pressed a whole tone sharp after each pluck, as a steel pedal would, through tremolo in a hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: { pluck: 0.15, touch: 0.3, decay: 1.6, bend: 200, volume: 3 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.8, depth: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'orbit-steel-glissando-in-reverse',
    name: 'Glissando in reverse',
    category: 'plucked',
    description:
      'A slow rolled chord answered by itself played backwards, the two rolls crossing in a hall.',
    instrument: { deviceId: 'harp', preset: 'Glissando', params: { sweep: 1.2, volume: -2 } },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 1200, mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-low-harp-cassette',
    name: 'Low harp, cassette',
    category: 'plucked',
    description:
      'Low strings plucked by the soundboard, close and woody, on a cassette with a plate behind.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { touch: 0.5, decay: 1.2, body: 0.8, volume: -2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Felt piano: the soft piano of the same rooms, widened or slapped.
  {
    id: 'orbit-steel-felt-piano-widened',
    name: 'Felt piano, widened',
    category: 'keys',
    description:
      'A felt piano played soft, doubled a few cents sharp and flat with the copies dulled, far back in a cathedral.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.8,
        hardness: 0.25,
        soft: 1,
        reverbMix: 0.1,
        outputDb: -14,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Treated piano' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'orbit-steel-front-room-upright',
    name: 'Front room upright',
    category: 'keys',
    description:
      'A bare upright with no felt down, one tape slap behind each note and a little spring, close and plain.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.5, reverbMix: 0, outputDb: -16.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 120,
          feedback: 0.12,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.3,
          highCut: 5000,
          spread: 0,
          mix: 0.28,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
    ],
  },

  // Atmosphere: what is in the room and below the window.
  {
    id: 'orbit-steel-idle-amp-hum',
    name: 'Idle amp hum',
    category: 'texture',
    description:
      'Mains hum tuned to the held key, pulsing in a tremolo and ringing a spring: an amp waiting to be played.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.6, tone: 0.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.4, depth: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'orbit-steel-shore-far-below',
    name: 'Shore far below',
    category: 'texture',
    description:
      'A slow shore breaking somewhere below, on tape, with a very large space opening behind each wave.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.45, tone: 0.45, attack: 3, volume: -5, width: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.7 } },
    ],
  },

  // Aurora: brass pads that keep swelling, as a bed.
  {
    id: 'orbit-steel-soft-brass-swell',
    name: 'Soft brass swell',
    category: 'pad',
    description:
      'A soft brass pad that starts dark and keeps swelling while it is held, in a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 2.2, swell: 0.6, release: 5, volume: -12 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'orbit-steel-low-slow-opening',
    name: 'Low slow opening',
    category: 'pad',
    description:
      'A low fifth that opens from dark over four seconds and goes on swelling, on tape in a hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 500, attack: 4, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Bow: one string held by a magnet, and driven to its octave.
  {
    id: 'orbit-steel-magnet-held-string',
    name: 'Magnet-held string',
    category: 'string',
    description:
      'One guitar string held singing by a magnetic sustainer, slow to speak, with tape echoes in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        attack: 1.4,
        release: 3,
        brightness: 0.45,
        vibrato: 0.2,
        vibratoRate: 4.5,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 400, feedback: 0.4, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'orbit-steel-string-feedback-chord',
    name: 'String feedback chord',
    category: 'string',
    description:
      'Strings driven until each jumps to its octave, through a warm stack and a long spring.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 2, volume: -14.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },

  // Chamber strings: a muted section far off, and one player through the amp.
  {
    id: 'orbit-steel-muted-section-far',
    name: 'Muted section, far',
    category: 'string',
    description:
      'Five muted players swelling in without vibrato, on tape, far back in a cathedral.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 5, attack: 3, release: 4, air: 0.4, scatter: 0.5, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'orbit-steel-solo-bow-tremolo',
    name: 'Solo bow tremolo',
    category: 'string',
    description:
      'A single close player through a slow amp tremolo and a plate, for a line over the steel.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.4, release: 1.5, vibrato: 6, width: 0.3, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2.3, depth: 0.6 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },

  // Choir: church singing heard from another room, and breath.
  {
    id: 'orbit-steel-chapel-choir-far',
    name: 'Chapel choir, far',
    category: 'voice',
    description:
      'A small choir heard through a speaker down the hall, its vowels moving slowly, with a plate over it.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { motion: 0.7, breath: 0.2, vibrato: 3, width: 0.5, volume: -8.3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { distance: 0.6, room: 0.7 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'orbit-steel-breath-over-steel',
    name: 'Breath over steel',
    category: 'voice',
    description:
      'Singers who are mostly breath, slow to arrive, with a reverb an octave up above them.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 3, vowel: 0.2, tone: 7000, volume: -14.5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.4 } }],
  },

  // Chord harp: the strum-plate toy that turns up on these records, slow and soft.
  {
    id: 'orbit-steel-swept-chord-tremolo',
    name: 'Swept chord, tremolo',
    category: 'plucked',
    description:
      'A strum-plate chord swept upward over a soft pad of the same notes, through a gentle amp tremolo in a hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 60, sustain: 4, tone: 0.4, pad: 0.5, volume: -11.3 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2.8, depth: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-up-and-back-strum',
    name: 'Up-and-back strum',
    category: 'plucked',
    description:
      'A chord swept slowly up and back across four octaves of soft strings, repeated by tape heads in a plate.',
    instrument: {
      deviceId: 'chord-harp',
      params: {
        strum: 140,
        direction: 2,
        span: 3,
        sustain: 6,
        tone: 0.35,
        pad: 0.15,
        spread: 0.8,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Clarinet: a reed that arrives late, and a subtone played close.
  {
    id: 'orbit-steel-reed-singing-hall',
    name: 'Reed, singing hall',
    category: 'wind',
    description:
      'A clarinet that takes more than a second to arrive on each note, in a hall whose tail sings a soft oo.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.05, breath: 0.55, attack: 2.5, release: 3.5, volume: -3.3 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 6, mix: 0.35 } }],
  },
  {
    id: 'orbit-steel-subtone-and-slap',
    name: 'Subtone and slap',
    category: 'wind',
    description: 'A breathy subtone reed played close, with one dark slap echo and a small plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { vibrato: 0.2, volume: -4.4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 120, tone: 2400, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // Drone: fifths and a just major chord to lay the steel on.
  {
    id: 'orbit-steel-low-orbit-fifths',
    name: 'Low orbit fifths',
    category: 'drone',
    description:
      'Fifths that wander in pitch and level over a sub octave, in a hall whose tail sings like low monks.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { movement: 0.6, attack: 4, volume: -8.2 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } }],
  },
  {
    id: 'orbit-steel-major-light-below',
    name: 'Major light below',
    category: 'drone',
    description:
      'A just major chord of near-sine partials with tuned air, slow to arrive, on tape in a cathedral.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { sub: 0.4, cutoff: 3000, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },

  // Ember: a warm bed, and a steel made of oscillators.
  {
    id: 'orbit-steel-warm-pad-turning',
    name: 'Warm pad, turning',
    category: 'pad',
    description: 'A warm two-oscillator pad through a slowly turning speaker and a plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { cutoff: 1000, ampAttack: 1.8, lfo2Amount: 0, volume: -5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'orbit-steel-oscillator-bar-slide',
    name: 'Oscillator bar slide',
    category: 'pad',
    description:
      'One triangle voice that glides half a second to each new note under a bar vibrato: a steel made of oscillators.',
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 2,
        osc2Shape: 3,
        osc2Coarse: 12,
        oscMix: 0.25,
        filterSlope: 0,
        cutoff: 2400,
        keyTrack: 0.6,
        ampAttack: 0.35,
        ampDecay: 2,
        ampSustain: 0.8,
        ampRelease: 2.5,
        velToAmp: 0.4,
        lfo2Rate: 4.6,
        lfo2Dest: 0,
        lfo2Amount: 0.006,
        voiceMode: 2,
        glide: 0.5,
        unisonVoices: 2,
        unisonDetune: 8,
        unisonSpread: 0.6,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 130,
          feedback: 0.15,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          highCut: 6000,
          spread: 0,
          mix: 0.25,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'keys',
  },

  // Flute: low flutes as a slow chord, and a wood flute with one slap.
  {
    id: 'orbit-steel-low-flute-chord',
    name: 'Low flute chord',
    category: 'wind',
    description:
      'Low flutes held as a chord, about a second to speak, doubled a few cents wide in a long plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 1.4, vibrato: 0.2, volume: -16 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-wood-flute-slap',
    name: 'Wood flute slap',
    category: 'wind',
    description:
      'A wood flute that scoops up into each note, with one tape slap and a hall behind it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { attack: 0.06, scoop: 60, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 150,
          feedback: 0.2,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          highCut: 4500,
          spread: 0,
          mix: 0.3,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },

  // Glass: the four-operator keyboard of the same years, as tines and as a pad.
  {
    id: 'orbit-steel-operator-tines',
    name: 'Operator tines',
    category: 'keys',
    description:
      'A soft four-operator electric piano with grain repeats that climb an octave behind it, in a hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { decay: 2.5, release: 1.2, volume: -11 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { feedback: 0.35, mix: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'orbit-steel-beating-glass-climb',
    name: 'Beating glass climb',
    category: 'pad',
    description:
      'A four-operator pad of beating partials, slow to speak, in a reverb whose tail climbs an octave the longer it rings.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { attack: 3, spread: 0.5, volume: -20.4 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Rising fifths',
        params: { interval: 1, mix: 0.4, width: 0.4 },
      },
    ],
  },

  // Grain: whatever is loaded, held or turned round.
  {
    id: 'orbit-steel-loaded-sound-held',
    name: 'Loaded sound, held',
    category: 'pad',
    description:
      'Whatever sound is loaded, stopped at one moment and held as a pad that rocks between dark and bright, in a long plate.',
    instrument: {
      deviceId: 'grain-synth',
      params: {
        position: 0.45,
        scan: 0,
        size: 600,
        density: 8,
        spray: 0.06,
        detune: 8,
        octaves: 0,
        reverse: 0,
        attack: 1.6,
        release: 3.5,
        spread: 0.5,
        tone: 5000,
        volume: -16,
      },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 2, rate: 1.6, depth: 0.75, crossover: 600 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'orbit-steel-loaded-sound-backwards',
    name: 'Loaded sound, backwards',
    category: 'pad',
    description:
      'Whatever sound is loaded, read backwards in long grains and swelled in slowly, with dark repeats in a plate.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { size: 1200, attack: 3, tone: 4500, volume: -17 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // Handpan: more steel, with the hands taken off or set down in a cave.
  {
    id: 'orbit-steel-handless-steel-pan',
    name: 'Handless steel pan',
    category: 'bell',
    description:
      'A steel pan with the hand taken off each note by a swell, its octaves ringing on in a rising reverb.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { touch: 0.15, decay: 9, shimmer: 0.9, volume: -1.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 350 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'orbit-steel-cave-tongue-drum',
    name: 'Cave tongue drum',
    category: 'bell',
    description:
      'A soft steel tongue drum, low and round, in a dark cavern made of a swarm of short echoes.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { touch: 0.1, cavity: 0.8, decay: 8, volume: -3.7 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: { length: 1.1, blur: 0.9, feedback: 0.6, highCut: 1400, lowCut: 60, mix: 0.4 },
      },
    ],
  },

  // Horns: a chorale a long way back, and one flugelhorn.
  {
    id: 'orbit-steel-far-horn-chorale',
    name: 'Far horn chorale',
    category: 'wind',
    description:
      'A section of horns that is slow to arrive, with itself at half speed an octave below, far back in a very long hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 3, blow: 0.5, section: 0.8, volume: -6.2 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.45, decay: 9, size: 1.6 } },
    ],
    preview: 'chord',
  },
  {
    id: 'orbit-steel-flugel-dark-repeats',
    name: 'Flugel, dark repeats',
    category: 'wind',
    description:
      'A breathy flugelhorn alone, with dark bucket-brigade repeats behind it and a plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.3, breath: 0.6, attack: 0.35, vibrato: 0.2, volume: 0 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 420, mix: 0.28 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },

  // Ladder bass: the floor, and a bass that slides like the steel.
  {
    id: 'orbit-steel-soft-floor-sub',
    name: 'Soft floor sub',
    category: 'keys',
    description:
      'A sine-like sub with nothing on top, saturated a little and set in a small room: the floor under a slow chord.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 160, glide: 0.25, volume: -15 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 6, outputDb: -6 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'orbit-steel-sliding-bass-voice',
    name: 'Sliding bass voice',
    category: 'keys',
    description:
      'One bass voice that slides over half a second to each note, filter half open, with a slap and a dark spring.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: { wave: 0.4, cutoff: 900, glide: 0.6, volume: 2.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 135,
          feedback: 0.15,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          lowCut: 80,
          highCut: 4000,
          spread: 0,
          mix: 0.25,
        },
      },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark amp spring',
        params: { mix: 0.3, width: 1, springs: 1 },
      },
    ],
    preview: 'line',
  },

  // Mallets: vibraphone with its own tremolo, and a rolled chord.
  {
    id: 'orbit-steel-motor-vibes-slow',
    name: 'Motor vibes, slow',
    category: 'bell',
    description:
      'Vibraphone bars struck soft with the motor throbbing slowly, a tremolo of their own, in a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.3, decay: 1.6, motor: 0.85, motorRate: 3.2, volume: -6.4 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'orbit-steel-rolled-bars-rising',
    name: 'Rolled bars, rising',
    category: 'bell',
    description:
      'A marimba chord rolled into a soft shimmer, in a reverb that swells up after it instead of dying away.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.1, decay: 1.5, roll: 9, volume: -14.3 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Slow bloom', params: { mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Bells: a rubbed bowl going round, and a church bell over a field.
  {
    id: 'orbit-steel-rubbed-bowl-circling',
    name: 'Rubbed bowl, circling',
    category: 'bell',
    description:
      'A singing bowl rubbed rather than struck, circling slowly from side to side in a very large space.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 25, hardness: 0.1, detune: 1.2, volume: -10.5, spread: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.25 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
    preview: 'line',
  },
  {
    id: 'orbit-steel-far-field-bell',
    name: 'Far field bell',
    category: 'bell',
    description:
      'A church bell heard from across a field: the air of a room first, then a cathedral tail.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 20, hardness: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },

  // Reed organ: church flutes through a turning speaker, and a pump organ on cassette.
  {
    id: 'orbit-steel-chapel-rotary',
    name: 'Chapel rotary',
    category: 'organ',
    description:
      'Flute ranks through a slowly turning speaker and a spring: a small church organ at rest.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { reed: 0.1, attack: 0.15, release: 1, volume: -15 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'orbit-steel-pump-organ-cassette',
    name: 'Pump organ, cassette',
    category: 'organ',
    description:
      'A wheezing reed organ with its bellows heard, low on the keyboard, widened by a slow chorus, on a cassette in a small room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { sub: 0.3, breath: 0.6, bellows: 1, tone: 1800, volume: -9 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle Widener', params: { depth: 35, hpHz: 60, mix: 0.5 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Outdoors: the night outside the room where the tape is running.
  {
    id: 'orbit-steel-night-field-crickets',
    name: 'Night field crickets',
    category: 'texture',
    description:
      'A field of crickets at a distance on a warm night, its top rolled off, on tape, with a hall making the air larger.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: { density: 0.8, distance: 0.9, tone: 0.3, volume: 5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'orbit-steel-far-ridge-storm',
    name: 'Far ridge storm',
    category: 'texture',
    description:
      'Thunder a long way off, rolling into a very large space for as long as a key is held.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.7, distance: 0.75, tone: 0.7, volume: -5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, lowCut: 30 } }],
  },

  // Sampler: whatever is loaded, swelled in or broken into grains.
  {
    id: 'orbit-steel-loaded-sound-swelled',
    name: 'Loaded sound, swelled',
    category: 'pad',
    description:
      'Whatever sound is loaded, an octave down with tape wobble, faded in by a pedal and left in a plain hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 0.3, release: 4, wobble: 0.6, volume: -17.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 1500 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'orbit-steel-loaded-sound-grains',
    name: 'Loaded sound, grains',
    category: 'pad',
    description:
      'Whatever sound is loaded, smeared into long overlapping grains, half of them backwards, in a plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { attack: 0.3, release: 2, volume: -13.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear' },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },

  // String machine: the ensemble keyboard, slow and phased, and its low octave.
  {
    id: 'orbit-steel-ensemble-slow-phase',
    name: 'Ensemble, slow phase',
    category: 'string',
    description:
      'A string ensemble keyboard slow in arriving, dark and wide, through a slow phaser in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { high: 0.1, tone: 1500, speed: 0.6, volume: -6.8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'orbit-steel-low-ensemble-sway',
    name: 'Low ensemble sway',
    category: 'string',
    description:
      'The low octave of the string ensemble through a harmonic tremolo that sways rather than pulses, in a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.4, release: 4, tone: 1000, drift: 0.5, volume: 2.4 },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 2, rate: 2.8, depth: 0.7, crossover: 250 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },

  // Tanpura: drone strings, as a slow wall and plain through the amp.
  {
    id: 'orbit-steel-slow-string-wall',
    name: 'Slow string wall',
    category: 'drone',
    description:
      'Four drone strings plucked round every nine seconds, each blooming into overtones, on tape in a very large space.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.7, speed: 9, body: 0.5, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'orbit-steel-plain-drone-tremolo',
    name: 'Plain drone, tremolo',
    category: 'drone',
    description:
      'Drone strings with the buzz almost off, plain and round, through amp tremolo and a long spring.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { tuning: 1, jawari: 0.15, speed: 5, decay: 10, volume: -1.8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.4, depth: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },

  // Tape orchestra: slowed cellos and a choir, as heard on a worn reel.
  {
    id: 'orbit-steel-octave-down-cellos',
    name: 'Octave-down cellos',
    category: 'string',
    description:
      'Cellos on tape slowed to half speed, an octave down, widened a little and far back in a cathedral.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 1.2, release: 3.5, age: 0.5, vibrato: 0.3, volume: -15 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'orbit-steel-tape-choir-halo',
    name: 'Tape choir halo',
    category: 'voice',
    description:
      'A choir from a strip of tape under each key, slow to arrive, with a reverb an octave up above it.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 1.5, release: 2.5, volume: -11 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
  },

  // Thesis: pitched noise, as a far choir and as a strum of air.
  {
    id: 'orbit-steel-noise-choir-far',
    name: 'Noise choir, far',
    category: 'pad',
    description:
      'Filtered noise ringing at the played notes and their mirrors, breathing slowly, far back in a cathedral.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 80, attack: 2, release: 5, breatheRate: 0.12 },
    },
    effects: [
      { deviceId: 'ambient-comp', params: { threshold: 0, ratio: 1, makeup: 5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'orbit-steel-air-strummed',
    name: 'Air, strummed',
    category: 'pad',
    description:
      'Bands of noise strummed across a chord, each a soft pitched breath, repeated by tape heads in a plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { strum: 90, release: 2.5, scale: 4, root: 2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, output: -1 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },

  // Wavetable: a hollow pad that phases slowly, and a still chord of near-sines.
  {
    id: 'orbit-steel-hollow-pad-phasing',
    name: 'Hollow pad, phasing',
    category: 'pad',
    description:
      'A hollow wavetable pad that changes slowly while held, every partial shifted a fraction of a hertz, in a hall.',
    instrument: {
      deviceId: 'wavetable',
      params: {
        table: 3,
        position: 0.4,
        motion: 0.8,
        rate: 0.07,
        detune: 12,
        sub: 0.3,
        cutoff: 1500,
        resonance: 0.3,
        attack: 3.5,
        release: 6,
        spread: 0.6,
        volume: -11.9,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', params: { mix: 0.4, width: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'orbit-steel-still-sine-pad',
    name: 'Still sine pad',
    category: 'pad',
    description:
      'A chord of near-sines with no movement at all, slow to speak, thickened by a tape preamp, in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { sub: 0.2, cutoff: 1400, attack: 3, release: 6, volume: -19.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // West Coast: a woody pluck with a slap, and a slow fold.
  {
    id: 'orbit-steel-wooden-pluck-slapped',
    name: 'Wooden pluck, slapped',
    category: 'plucked',
    description: 'A woody folded pluck through a slap echo and a spring tank, short and near.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.25, decay: 1.8, colour: 0.5, chance: 0.1, volume: -2.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'orbit-steel-slow-fold-swell',
    name: 'Slow fold swell',
    category: 'pad',
    description:
      'A tone that folds brighter over two seconds and darkens as it fades, thickened by a detuned double, in a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.25, attack: 2.5, drift: 0.6, volume: -12.3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thick double' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },

  // Zither: paired strings a long way back, and hammers dissolved.
  {
    id: 'orbit-steel-paired-strings-far',
    name: 'Paired strings, far',
    category: 'plucked',
    description:
      'Paired strings an octave apart, strummed and left to ring over their sympathetic strings, with one tape slap in a cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { exciter: 0, strum: 70, brightness: 0.5, sympathy: 0.6, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 130,
          feedback: 0.12,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          highCut: 5000,
          spread: 0,
          mix: 0.25,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'orbit-steel-hammered-dissolved',
    name: 'Hammered, dissolved',
    category: 'plucked',
    description:
      'Hammered strings rolled into a shimmer and smeared until the strikes blur into one wash, in a long plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 7, brightness: 0.5, sympathy: 0.8, volume: -14.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.5, width: 0 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
]
