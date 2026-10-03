import { type FactoryPreset } from '../types'

// Stairwell Choir of One: one voice sung into a looper again and again until it is a choir, in the
// kind of reverb a stairwell or a church gives you for nothing. Loops stand before the rooms.

export const PRESETS: readonly FactoryPreset[] = [
  // choir: the one voice, pass by pass
  {
    id: 'stairwell-choir-one-soprano-caught',
    name: 'One soprano, caught',
    category: 'voice',
    description:
      'One straight-toned soprano on ah, alone, with a looper catching her and a bright stairwell answering.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        voice: 1.3,
        breath: 0.35,
        vibrato: 4,
        attack: 0.25,
        release: 1.2,
        tone: 8000,
        width: 0.2,
        volume: -6.5,
      },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Soft bed',
        params: { length: 1.5, spread: 0.1, mix: 0.3 },
      },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 3, midDecay: 4, damping: 12000, mix: 0.45 },
      },
    ],
    preview: 'line',
  },
  {
    id: 'stairwell-choir-round-with-herself',
    name: 'Round with herself',
    category: 'voice',
    description:
      'One lower voice on oh whose line comes back every two seconds and is sung over, a round with herself in a stone nave.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.75,
        voice: 1.12,
        breath: 0.3,
        ensemble: 0.1,
        vibrato: 0,
        attack: 0.5,
        release: 1.8,
        tone: 6000,
        width: 0.2,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2, feedback: 0.8, wear: 0, wow: 0.05, spread: 0 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'stairwell-choir-choir-of-one',
    name: 'Choir of one',
    category: 'voice',
    description:
      'The whole stack: a small bright ah doubled to either side and gathered in a hall that sings back.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        voice: 1.3,
        motion: 0.25,
        breath: 0.4,
        ensemble: 0.45,
        vibrato: 3,
        attack: 1.2,
        release: 4,
        tone: 8500,
        width: 0.9,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { mix: 0.3 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral choir', params: { highCut: 10000, mix: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-high-descant',
    name: 'High descant',
    category: 'voice',
    description:
      'A small ee without vibrato with an octave of itself above it, thinned of its low end, over a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: {
        voice: 1.4,
        breath: 0.25,
        ensemble: 0.3,
        attack: 0.6,
        release: 3,
        tone: 11000,
        width: 0.7,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Glass octaves',
        params: { dry: 0.7, up1: 0.65, up2: 0, resonance: 0, spread: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 300, presence: 3, air: 5 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'stairwell-choir-hummed-bed',
    name: 'Hummed bed',
    category: 'voice',
    description:
      'A closed oo hummed low and without breath, slow to arrive, dark under everything else.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        voice: 1.08,
        motion: 0.1,
        breath: 0.05,
        ensemble: 0.5,
        vibrato: 0,
        attack: 3,
        release: 5,
        tone: 1600,
        width: 0.7,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.45 } },
    ],
  },
  {
    id: 'stairwell-choir-breath-before-singing',
    name: 'Breath before singing',
    category: 'voice',
    description:
      'More air than note: the breath before singing, thinned of its low end and lost in a cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: {
        vowel: 0.25,
        voice: 1.3,
        motion: 0.8,
        attack: 2.2,
        release: 6,
        tone: 10000,
        width: 0.35,
        volume: -17.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Rumble Cut',
        params: { cutoffHz: 500, resonance: 0.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
      { deviceId: 'stereo-widener', params: { width: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-rising-vowels',
    name: 'Rising vowels',
    category: 'voice',
    description:
      'A section drifting from vowel to vowel while the reverb above it climbs an octave at a time.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: {
        vowel: 0.5,
        voice: 1.22,
        ensemble: 0.7,
        vibrato: 3,
        attack: 2.5,
        release: 6,
        tone: 7000,
        volume: -10.5,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 10, shimmer: 0.4, size: 0.6, tone: 5000, mix: 0.2 },
      },
      { deviceId: 'vowel-reverb', preset: 'Moving vowels', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-empty-pool-alto',
    name: 'Empty pool alto',
    category: 'voice',
    description:
      'Lower voices on eh that speak quickly into a hard tiled room, with one short echo behind them.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0.28,
        voice: 1.1,
        motion: 0.15,
        breath: 0.2,
        ensemble: 0.55,
        vibrato: 2,
        attack: 0.3,
        release: 1.2,
        tone: 6000,
        width: 0.7,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 130, feedback: 0.08, highCut: 7000, mix: 0.22 },
      },
      {
        deviceId: 'zita-rev1',
        preset: 'Room',
        params: { lowDecay: 1.4, midDecay: 1.9, damping: 14000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'stairwell-choir-back-pew-section',
    name: 'Back pew section',
    category: 'voice',
    description:
      'A full young section on oh without vibrato, heard from the back pew, nearly all of it reverb.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0.75,
        voice: 1.36,
        motion: 0.3,
        breath: 0.35,
        ensemble: 1,
        vibrato: 0,
        attack: 1.5,
        release: 4,
        tone: 9000,
        width: 0.3,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 150, air: 2 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { preDelay: 100, mix: 0.65 } },
    ],
  },

  // sampler: written for whatever is loaded, most of all a sung note; the previews play its soft tone
  {
    id: 'stairwell-choir-held-phrase',
    name: 'Held phrase',
    category: 'pad',
    description:
      'Whatever is loaded, looped on a long crossfade so one sung note holds as a chord in a cathedral.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        start: 0.2,
        end: 0.8,
        crossfade: 350,
        attack: 0.9,
        release: 3.5,
        tone: 9000,
        wobble: 0.08,
        velocity: 0.3,
        volume: -17,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 5000, mix: 0.45 } },
    ],
  },
  {
    id: 'stairwell-choir-octave-under-yourself',
    name: 'Octave under yourself',
    category: 'pad',
    description:
      'The loaded sound an octave down as the lowest layer of the stack, slow and warm in a very large space.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: {
        crossfade: 300,
        fine: 0,
        attack: 1.2,
        release: 4,
        tone: 3500,
        wobble: 0.3,
        volume: -22,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.7, decay: 14, highCut: 4000 },
      },
    ],
  },
  {
    id: 'stairwell-choir-fifth-above-yourself',
    name: 'Fifth above yourself',
    category: 'pad',
    description:
      'The loaded sound a fifth up with its top left open, doubled left and right: the harmony you would sing next.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        tune: 7,
        crossfade: 200,
        attack: 0.5,
        release: 2.5,
        tone: 12000,
        wobble: 0.1,
        velocity: 0.4,
        volume: -17,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wide open', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-sung-backwards',
    name: 'Sung backwards',
    category: 'texture',
    description:
      'The loaded sound reversed so each key swells towards its own start, in a reverb that rises backwards behind it.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { attack: 0.3, release: 2, volume: -8.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long reverse', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'stairwell-choir-one-take-each',
    name: 'One take each',
    category: 'keys',
    description:
      'Each key plays the loaded sound once through the converters of an early looper, and an echo brings pieces back.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { release: 1.2, tone: 12000, velocity: 0.7, volume: -14.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze' },
      { deviceId: 'echo-memory', preset: 'Remembering', params: { spread: 0.4, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.8, mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-rehearsal-cassette',
    name: 'Rehearsal cassette',
    category: 'keys',
    description:
      'The loaded sound on a wavering loop with a coarse looper behind it, dulled by a worn cassette in a bedroom.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Worn tape',
      params: { attack: 0.2, release: 2, tone: 4000, wobble: 0.7, volume: -13.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { mix: 0.3 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-fluttered-breath',
    name: 'Fluttered breath',
    category: 'texture',
    description:
      'A short stretch of the loaded sound run forwards and back until it flutters, layered by a slow loop.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: {
        start: 0.4,
        end: 0.55,
        tune: 0,
        attack: 1,
        release: 4,
        tone: 8000,
        wobble: 0.15,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 3, feedback: 0.8, wear: 0.1, wow: 0.1, spread: 0, mix: 0.45 },
      },
      { deviceId: 'vowel-reverb', preset: 'Whispering hall', params: { mix: 0.35 } },
    ],
  },

  // grain-synth: also for whatever is loaded; one recording made into many
  {
    id: 'stairwell-choir-frozen-syllable',
    name: 'Frozen syllable',
    category: 'pad',
    description:
      'One instant of the loaded sound held still under each key, a vowel that does not end, in a hall that sings.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        position: 0.35,
        size: 500,
        density: 10,
        spray: 0.04,
        attack: 1.5,
        release: 4,
        spread: 0.6,
        tone: 9000,
        volume: -18.5,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
  },
  {
    id: 'stairwell-choir-stretched-hymn',
    name: 'Stretched hymn',
    category: 'pad',
    description:
      'The loaded sound read through at a crawl and at its own pitch, with a faint octave rising in a ten-second tail.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Slow stretch',
      params: {
        scan: 0.06,
        size: 320,
        density: 8,
        spray: 0.08,
        detune: 4,
        attack: 1,
        release: 3,
        spread: 0.5,
        tone: 10000,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 10, shimmer: 0.25, mix: 0.35 },
      },
    ],
  },
  {
    id: 'stairwell-choir-rafter-octaves',
    name: 'Rafter octaves',
    category: 'pad',
    description:
      'A dense slow cloud with half its grains thrown up or down an octave, bright and wide over a long plate.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: {
        position: 0.3,
        density: 12,
        octaves: 0.5,
        attack: 2,
        release: 6,
        spread: 0.8,
        tone: 14000,
        volume: -17,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'stairwell-choir-backwards-congregation',
    name: 'Backwards congregation',
    category: 'texture',
    description:
      'Long reversed grains creeping backwards through the loaded sound, each swelling in, with a reversed loop under.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: {
        position: 0.5,
        scan: -0.15,
        size: 1100,
        attack: 2,
        release: 6,
        spread: 0.6,
        tone: 7000,
        volume: -13.5,
      },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Backwards bed', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-clipped-syllables',
    name: 'Clipped syllables',
    category: 'texture',
    description:
      'Short grains picked one at a time from around one spot, a broken thread that flickers back out of an echo.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: {
        position: 0.25,
        scan: 0.03,
        size: 70,
        density: 1,
        spray: 0.4,
        shape: 0.3,
        attack: 0.02,
        release: 1.2,
        spread: 0.7,
        tone: 14000,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-many-of-you',
    name: 'Many of you',
    category: 'pad',
    description:
      'One recording spread into a crowd: dense grains a little out of tune with each other, thickened in a hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Cloud',
      params: {
        scan: 0.04,
        size: 450,
        density: 14,
        spray: 0.5,
        detune: 24,
        octaves: 0,
        reverse: 0.1,
        attack: 1.2,
        release: 4,
        spread: 1,
        tone: 10000,
        volume: -11.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal Thickener' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-slowed-lowest-layer',
    name: 'Slowed lowest layer',
    category: 'pad',
    description:
      'Large grains of the loaded sound replayed at half speed an octave down, a dark slow floor for the stack.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        position: 0.15,
        size: 900,
        density: 6,
        spray: 0.15,
        attack: 2,
        release: 5,
        tone: 1500,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 2500, mix: 0.8 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // organ: the instrument that was already in the building
  {
    id: 'stairwell-choir-empty-church-flutes',
    name: 'Empty church flutes',
    category: 'organ',
    description:
      'Stopped flutes with no reed at all, soft and breathy with the top rolled off, in an empty church.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.4, breath: 0.4, attack: 0.5, release: 1.5, tone: 3500, volume: -13 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { lowDecay: 6, mix: 0.45 } },
    ],
  },
  {
    id: 'stairwell-choir-pump-organ-hymn',
    name: 'Pump organ hymn',
    category: 'organ',
    description:
      'A reedy pump organ with an uneven bellows, whose reverb comes back as a soft wordless choir.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { reed: 0.6, celeste: 0.3, bellows: 0.7, attack: 0.25, release: 0.8, volume: -14.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 8, mix: 0.4 } }],
  },
  {
    id: 'stairwell-choir-celeste-floor',
    name: 'Celeste floor',
    category: 'drone',
    description:
      'Two low ranks tuned apart so they beat slowly, a held fifth under the voices in a very large space.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: {
        sub: 0.4,
        octave: 0.4,
        celeste: 0.8,
        attack: 2.5,
        release: 6,
        tone: 2000,
        volume: -8,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.4 } }],
  },
  {
    id: 'stairwell-choir-vestry-harmonium',
    name: 'Vestry harmonium',
    category: 'organ',
    description:
      'A harmonium close up in a small room, breath and bellows audible, recorded to a quiet reel of tape.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        reed: 0.4,
        celeste: 0.15,
        breath: 0.45,
        bellows: 0.5,
        attack: 0.15,
        release: 0.5,
        tone: 2800,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.12, flutter: 0.1, hiss: 0.2 } },
    ],
  },
  {
    id: 'stairwell-choir-tremulant-solo',
    name: 'Tremulant solo',
    category: 'organ',
    description:
      'One trembling flute stop playing the line alone, each phrase caught by a loop and a plate behind it.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { octave: 0.3, tremulant: 0.5, attack: 0.15, release: 0.8, tone: 5000, volume: -4 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 3.5, feedback: 0.6, wear: 0.05, wow: 0.05, spread: 0.1, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { decay: 0.8, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'stairwell-choir-slow-rotor-chorale',
    name: 'Slow rotor chorale',
    category: 'organ',
    description:
      'A fuller registration turning slowly in a rotating speaker across the room, then a little plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 0.5,
        twelfth: 0.25,
        fifteenth: 0.35,
        reed: 0.3,
        attack: 0.1,
        release: 1,
        tone: 5000,
        volume: -12.5,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.8 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { decay: 0.75, mix: 0.2 } },
    ],
  },
  {
    id: 'stairwell-choir-pipes-through-walls',
    name: 'Pipes through walls',
    category: 'organ',
    description:
      'Pipes heard from the stairwell: three seconds to speak, the top taken off, the building doing the rest.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { tone: 900, volume: -14 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 60, highCut: 2500 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.6 } },
    ],
  },

  // tape-orchestra: choirs and a few strings from a tape-replay keyboard
  {
    id: 'stairwell-choir-new-reel-choir',
    name: 'New reel choir',
    category: 'voice',
    description:
      'A choir from a fresh strip of tape under each key, clear and nearly steady, in a ten-second hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        age: 0.08,
        hiss: 0.08,
        tone: 0.6,
        attack: 0.4,
        release: 2,
        players: 0.8,
        vibrato: 0.2,
        volume: -11.8,
      },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 10, damping: 0.25, size: 1.7, breathDepth: 0 },
      },
    ],
  },
  {
    id: 'stairwell-choir-half-speed-choir',
    name: 'Half-speed choir',
    category: 'voice',
    description:
      'The choir tape slowed to half speed, an octave down and slow to speak, in a very large space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        age: 0.3,
        hiss: 0.15,
        tone: 0.2,
        speed: 1,
        attack: 1,
        release: 3,
        players: 0.9,
        vibrato: 0.3,
        spread: 0.6,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, width: 0.8, mix: 0.45 } },
    ],
  },
  {
    id: 'stairwell-choir-northern-quartet',
    name: 'Northern quartet',
    category: 'string',
    description:
      'A few violins from tape, close and plain with little vibrato, answered by a five-second hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        age: 0.25,
        hiss: 0.15,
        tone: 0,
        attack: 0.25,
        release: 1.2,
        players: 0.35,
        vibrato: 0.25,
        spread: 0.6,
        volume: -10.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 5, mix: 0.4 } }],
  },
  {
    id: 'stairwell-choir-cellos-underneath',
    name: 'Cellos underneath',
    category: 'string',
    description: 'Tape cellos at half speed on a low fifth, their reverb coming back as a low oh.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 0.9, release: 3, vibrato: 0.3, volume: -7.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } }],
    preview: 'low',
  },
  {
    id: 'stairwell-choir-tape-flute-round',
    name: 'Tape flute round',
    category: 'wind',
    description:
      'Breathy tape flutes playing a line that comes back two and a half seconds later, under itself, on a plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.3, attack: 0.08, release: 0.8, vibrato: 0.35, volume: -5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2.5, feedback: 0.75, wear: 0.25, spread: 0.1, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-worn-verse',
    name: 'Worn verse',
    category: 'voice',
    description:
      'A recording of a choir in a church on tape played too often: the room first, then the wow, hiss and dropouts.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 0.7, hiss: 0.3, volume: -10.5 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { midDecay: 5, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Worn thin', params: { age: 0.6, hiss: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-reed-chorale-bed',
    name: 'Reed chorale bed',
    category: 'wind',
    description:
      'Orchestra reeds from tape held as a chord, a looper keeping the last few seconds under them on a plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.3, release: 1.5, players: 0.7, vibrato: 0.2, volume: -9.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 2.5, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // modal-bells: the few bells between the verses
  {
    id: 'stairwell-choir-loft-handbells',
    name: 'Loft handbells',
    category: 'bell',
    description:
      'Small cast bells struck one at a time, bright and close, earlier strikes drifting back dull in a stone church.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        decay: 6,
        damping: 0.5,
        hardness: 0.75,
        position: 0.1,
        brightness: 0.85,
        release: 0.2,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 5500, mix: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-far-steeple',
    name: 'Far steeple',
    category: 'bell',
    description:
      'One church bell a long way off, its strike softened and its top rolled away, hanging in a very large space.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 20, damping: 0.5, hardness: 0.4, brightness: 0.35, volume: -3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 16, mix: 0.5 } },
    ],
    preview: 'hold',
  },
  {
    id: 'stairwell-choir-rubbed-glass-chord',
    name: 'Rubbed glass chord',
    category: 'bell',
    description:
      'Glasses rubbed until they sing a held chord, close to a voice, in a hall that answers in ah.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: {
        hardness: 0.1,
        detune: 1.2,
        sustain: 1,
        brightness: 0.45,
        release: 0.4,
        spread: 0.4,
        volume: -15,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'stairwell-choir-looped-music-box',
    name: 'Looped music box',
    category: 'bell',
    description:
      'A small music box comb whose last two seconds keep turning quietly under the new notes, in a chapel.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { hardness: 0.6, brightness: 0.5, spread: 0.1, volume: -3 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { spread: 0.1, mix: 0.35 } },
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { decay: 2.5, mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-bowl-round',
    name: 'Bowl round',
    category: 'bell',
    description:
      'Struck singing bowls on a four-second loop that fades a little each pass, so the notes pile into a chord.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { decay: 8, hardness: 0.5, spread: 0.3, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, wear: 0.1, wow: 0.1 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-bars-answered-backwards',
    name: 'Bars answered backwards',
    category: 'bell',
    description:
      'Metal bars under a soft mallet, each note answered by itself reversed and an octave up, on a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { hardness: 0.25, release: 0.3, volume: -4.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-landing-thumb-piano',
    name: 'Landing thumb piano',
    category: 'bell',
    description:
      'A thumb piano played on a concrete landing: close and hard, with a patter of short echoes off the walls.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { hardness: 0.7, brightness: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Room',
        params: { midDecay: 2.2, damping: 12000, mix: 0.3 },
      },
    ],
  },

  // acoustic-guitar: something to sing over
  {
    id: 'stairwell-choir-porch-nylon',
    name: 'Porch nylon',
    category: 'plucked',
    description:
      'A nylon guitar played with the thumb, its last phrase turning at half speed underneath, in a small chapel.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.15, sustain: 7, release: 3, strum: 30, volume: 0.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { spread: 0.25 } },
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-twelve-strings-ringing',
    name: 'Twelve strings ringing',
    category: 'plucked',
    description:
      'A twelve-string left to ring, with tuned strings that learn the notes and ring along, in a very large space.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { nail: 0.5, sustain: 10, release: 8, strum: 45, volume: -5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the melody', params: { decay: 6, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },

  // atmosphere: weather heard from inside the building
  {
    id: 'stairwell-choir-stairwell-rain',
    name: 'Stairwell rain',
    category: 'texture',
    description:
      'Heavy rain heard from inside: dense, far off, its top taken down by the concrete, in a hard room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { tone: 0.45, attack: 3, release: 6, width: 0.7, volume: 5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 120, highCut: 4500 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -12, gain: 1 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Room',
        params: { midDecay: 2.5, damping: 9000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'stairwell-choir-draught-that-sings',
    name: 'Draught that sings',
    category: 'texture',
    description:
      'Wind whistling at the pitch of the key through a gap, its reverb shaped into a slow sung vowel.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { movement: 0.7, attack: 1.5, release: 5, width: 0.6, volume: -1 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Cathedral choir',
        params: { resonance: 0.7, mix: 0.45 },
      },
    ],
  },

  // aurora: a warm polysynth under the voices
  {
    id: 'stairwell-choir-vespers-pad',
    name: 'Vespers pad',
    category: 'pad',
    description:
      'A resonant synth pad voiced like a choir, slow to arrive, under a reverb that climbs an octave and a fifth.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { brilliance: 1800, resonance: 0.5, attack: 2.5, release: 6, volume: -8.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Organ loft', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-brass-in-waves',
    name: 'Brass in waves',
    category: 'pad',
    description:
      'Soft synth horns that keep swelling while held, warmed by a tape preamp, in a hall that lets them in by waves.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 700, attack: 2, swell: 0.6, release: 5, volume: -13 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },

  // bowed-string: one cello, one string that sings
  {
    id: 'stairwell-choir-crypt-cello',
    name: 'Crypt cello',
    category: 'string',
    description:
      'A bowed cello on a low fifth, nearly without vibrato, in a stone room with a long low tail.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1.2, release: 3, pressure: 0.45, vibrato: 0.1, volume: -11.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 8, tone: 3500, lowCut: 30, mix: 0.4 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'stairwell-choir-string-in-thirds',
    name: 'String in thirds',
    category: 'string',
    description:
      'A string held singing without a bow, a third above and a sixth below added to its line in C major, on a plate.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 1,
        attack: 1.5,
        release: 0.8,
        brightness: 0.6,
        vibrato: 0.1,
        detune: 0,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Diatonic thirds',
        params: { mix: 45, output: 5, v1Pan: -35, v2Pan: 35 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },

  // chamber-strings: the quartet that came in for a day
  {
    id: 'stairwell-choir-still-quartet',
    name: 'Still quartet',
    category: 'string',
    description:
      'Four players with no vibrato and a good deal of bow air, slow to speak, in a plain long hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { players: 4, attack: 1.5, release: 4, air: 0.5, volume: -11 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 7, mix: 0.35 } }],
  },
  {
    id: 'stairwell-choir-bows-in-layers',
    name: 'Bows in layers',
    category: 'string',
    description:
      'Bows that are mostly air, each chord caught and held under the next as a layer, in a very large space.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 1.5, release: 3, volume: -7 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },

  // chord-harp: a strummed chord to start a loop with
  {
    id: 'stairwell-choir-lap-harp-hymn',
    name: 'Lap harp hymn',
    category: 'plucked',
    description:
      'A chord harp swept slowly up and back over three octaves, long dark echoes bringing back earlier sweeps, in a hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 120, span: 2, tone: 0.45, pad: 0.25, volume: -7.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Distant minute', params: { spread: 0.4, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, mix: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-strum-and-overdub',
    name: 'Strum and overdub',
    category: 'plucked',
    description:
      'Each strum is kept on a clean three-second loop and the next one lands on top of it, on a small plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 55, tone: 0.55, pad: 0.1, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 3, feedback: 0.82, wear: 0, wow: 0, spread: 0.1 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // clarinet: a reed where a second singer would stand
  {
    id: 'stairwell-choir-alto-reed',
    name: 'Alto reed',
    category: 'wind',
    description:
      'A clarinet that fades in from breath like a sung alto line, doubled a few cents apart, in a cathedral.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.45, breath: 0.5, attack: 1.2, release: 2.5, volume: -7 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Detuned double', params: { spread: 0.4, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { midDecay: 7, mix: 0.45 } },
    ],
  },
  {
    id: 'stairwell-choir-low-reed-held',
    name: 'Low reed held',
    category: 'wind',
    description:
      'A bass clarinet on a low fifth, breathy and soft, its tone smeared so the held notes hang in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { breath: 0.55, attack: 0.6, release: 2, volume: -5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },

  // drone: the note the first loop is sung against
  {
    id: 'stairwell-choir-clerestory-major',
    name: 'Clerestory major',
    category: 'drone',
    description:
      'A just major chord of slow partials with air in it, a faint octave climbing above, in a hall that sings ah.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { partials: 0.8, movement: 0.5, air: 0.4, cutoff: 6000, attack: 4, volume: -7 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Rising choir', params: { shimmer: 0.35, mix: 0.2 } },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'stairwell-choir-underfloor-fifths',
    name: 'Underfloor fifths',
    category: 'drone',
    description:
      'Wandering fifths over a sub octave, dark and slow, held level by a slow compressor in a very large dark space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { movement: 0.4, sub: 0.5, cutoff: 1400, attack: 4, volume: -8 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 20, highCut: 3500 } },
    ],
  },

  // dusk: a chorus polysynth, its own chorus left alone
  {
    id: 'stairwell-choir-polysynth-hymn',
    name: 'Polysynth hymn',
    category: 'pad',
    description:
      'A chorus polysynth with its filter half shut, slow in and slow out, in a twelve-second hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0.25, cutoff: 1800, envelope: 0.15, attack: 2.5, release: 5, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 12, damping: 0.3, size: 1.6, breathDepth: 0, mix: 0.45 },
      },
    ],
  },
  {
    id: 'stairwell-choir-whistled-filter-line',
    name: 'Whistled filter line',
    category: 'pad',
    description:
      'The filter singing two octaves above each key, almost a whistle, with pieces of the line drifting back reversed.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.5, release: 3, volume: -7.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Backwards glances', params: { spread: 0.3, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // ember: plain synth pads with air in them
  {
    id: 'stairwell-choir-upward-air',
    name: 'Upward air',
    category: 'pad',
    description:
      'An airy two-oscillator pad with a little noise in it, its repeats rebuilt an octave higher each time round.',
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        noiseLevel: 0.08,
        cutoff: 6000,
        ampAttack: 2.5,
        ampRelease: 6,
        unisonSpread: 0.8,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 640, size: 160, feedback: 0.5, tone: 5000, spread: 0.5, mix: 0.25 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { width: 0.8, mix: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-octave-glint-pad',
    name: 'Octave glint pad',
    category: 'pad',
    description:
      'A triangle and pulse pad, with a double-speed loop of itself glinting an octave above, in a hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { ampAttack: 1.2, ampRelease: 5, volume: -8 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave sparkle', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // felt-piano: the little piano
  {
    id: 'stairwell-choir-sanctuary-upright',
    name: 'Sanctuary upright',
    category: 'keys',
    description:
      'A felted upright played softly at the front of an empty church, the room much larger than the piano.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.7, hardness: 0.3, reverbMix: 0.1, width: 0.3, outputDb: -17.3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { preDelay: 40, mix: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-piano-kept-under',
    name: 'Piano kept under',
    category: 'keys',
    description:
      'A close felt piano with the noise of its action, the last bars drifting on in a loop and a faint pad behind.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0.15, outputDb: -12.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting memory', params: { mix: 0.3 } },
      { deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },

  // flute: breath with a pitch
  {
    id: 'stairwell-choir-flutes-as-breath',
    name: 'Flutes as breath',
    category: 'wind',
    description:
      'Low flutes blown so softly they are mostly breath, held as a chord in a hall that whispers back.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 1.8, release: 3.5, vibrato: 0.1, volume: -14.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle Widener' },
      { deviceId: 'vowel-reverb', preset: 'Whispering hall', params: { decay: 6, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'stairwell-choir-wood-flute-round',
    name: 'Wood flute round',
    category: 'wind',
    description:
      'A wood flute line that returns three and a half seconds later and plays under itself, in an eight-second hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { attack: 0.08, release: 1.2, vibrato: 0.25, scoop: 20, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 3.5, feedback: 0.8, wear: 0.15, wow: 0.15, spread: 0, mix: 0.45 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 8, size: 1.5, breathDepth: 0, mix: 0.35 },
      },
    ],
  },

  // fm-glass: glass where the bells are too heavy
  {
    id: 'stairwell-choir-glass-answered',
    name: 'Glass answered',
    category: 'bell',
    description:
      'Glass bells whose notes come back as short loops an octave up, as if answered from the loft, in a cave of echoes.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { brightness: 0.4, decay: 4, release: 5, volume: -6 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { repeats: 4, mix: 0.25 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-glass-voices',
    name: 'Glass voices',
    category: 'pad',
    description:
      'A slow glass pad whose reverb moves from vowel to vowel, so that the tail seems to be sung.',
    instrument: {
      deviceId: 'fm-glass',
      params: {
        algorithm: 3,
        ratio: 3,
        brightness: 0.3,
        decay: 8,
        attack: 2,
        release: 6,
        sustain: 1,
        detune: 9,
        feedback: 0.2,
        velocity: 0.4,
        spread: 0.8,
        volume: -19,
      },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Moving vowels', params: { decay: 10, mix: 0.45 } },
    ],
  },

  // guitar: one clean electric, picked or swelled
  {
    id: 'stairwell-choir-cold-room-guitar',
    name: 'Cold room guitar',
    category: 'plucked',
    description:
      'A clean electric guitar picked one string at a time, with soft dark repeats, in a bright hard hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.45, sustain: 10, tone: 3800, strum: 10, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 450, feedback: 0.4, mix: 0.25 },
      },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { midDecay: 3.5, damping: 10000, mix: 0.35 },
      },
    ],
  },
  {
    id: 'stairwell-choir-guitar-without-attack',
    name: 'Guitar without attack',
    category: 'plucked',
    description:
      'A guitar swelled in by its volume pedal, with a string pad growing an octave above whatever it plays.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1, volume: 6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { makeup: 13.5 } },
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // handpan: struck steel, softened and kept
  {
    id: 'stairwell-choir-atrium-handpan',
    name: 'Atrium handpan',
    category: 'bell',
    description:
      'A handpan played with soft fingers under a glass roof, with far separate echoes instead of a smooth tail.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 5, touch: 0.25, shimmer: 0.5, volume: -3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3 } }],
  },
  {
    id: 'stairwell-choir-tongue-drum-slow-bed',
    name: 'Tongue drum, slow bed',
    category: 'bell',
    description:
      'A steel tongue drum whose last notes return an octave down at half speed as a bed, in a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { volume: -1.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { spread: 0.25, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // harp: a harp through a delay, as a duet partner plays it
  {
    id: 'stairwell-choir-harp-through-delay',
    name: 'Harp through delay',
    category: 'plucked',
    description:
      'A concert harp with chorused echoes that soften each time round, as a harp sounds through a delay in a church.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { decay: 1.4, halo: 0.7, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 520, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { damping: 4500, mix: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-glissando-kept',
    name: 'Glissando kept',
    category: 'plucked',
    description:
      'Each key sweeps the strings up to its note, and the sweeps come back reversed on a four-second loop.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { sweep: 0.6, volume: 0 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Backwards layers',
        params: { length: 4, feedback: 0.7, spread: 0.2, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // horns: brass at the back of the church
  {
    id: 'stairwell-choir-rear-pew-brass',
    name: 'Rear pew brass',
    category: 'wind',
    description:
      'A horn section at the back of the church swelling over two seconds, half of what arrives being the room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.5, section: 0.8, attack: 2, release: 5, volume: -8 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { preDelay: 50, mix: 0.5 } }],
    preview: 'chord',
  },
  {
    id: 'stairwell-choir-flugelhorn-gathering',
    name: 'Flugelhorn gathering',
    category: 'wind',
    description:
      'A breathy flugelhorn played like a sung line, with an echo that gathers pieces of the last half minute behind it.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { breath: 0.6, attack: 0.4, release: 2, vibrato: 0.1, volume: 0 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Gathering', params: { spread: 0.3, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // ladder-bass: the synth bass of the later records
  {
    id: 'stairwell-choir-sub-beneath',
    name: 'Sub beneath',
    category: 'keys',
    description:
      'A near-sine sub with a little glide, given some transformer weight so small speakers hear it, almost dry.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 180, glide: 0.15, volume: -14 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'stairwell-choir-bass-that-arrives',
    name: 'Bass that arrives',
    category: 'keys',
    description:
      'Two beating sawtooths over a sub, driven a little and faded in by a swell so the bass arrives under the chord.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: {
        sub: 0.5,
        cutoff: 420,
        emphasis: 0.2,
        contour: 0.2,
        drive: 0.5,
        glide: 0.2,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1500 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },

  // mallets: soft bars after the singing stops
  {
    id: 'stairwell-choir-rolled-vibes-hymn',
    name: 'Rolled vibes hymn',
    category: 'bell',
    description:
      'Vibraphone chords rolled with soft mallets into a steady shimmer, motor turning slowly, in a nine-second hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { motor: 0.2, roll: 8, width: 0.3, volume: -16 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 9, size: 1.5, breathDepth: 0, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'stairwell-choir-celesta-afterwards',
    name: 'Celesta afterwards',
    category: 'bell',
    description:
      'A celesta played softly, each note followed by its own reverse, in a small chapel that sings back a little.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { decay: 1.5, damper: 0.4, volume: -10.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.25 } },
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { mix: 0.3 } },
    ],
  },

  // outdoors: what the sky was doing
  {
    id: 'stairwell-choir-rooftop-birds',
    name: 'Rooftop birds',
    category: 'texture',
    description:
      'Birds at dawn heard from a rooftop, several to each key and set a little way off, with a hall under them.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 1, distance: 0.6, movement: 0.15, width: 0.7, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 3.5, midDecay: 5, damping: 14000, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'stairwell-choir-draught-chimes',
    name: 'Draught chimes',
    category: 'texture',
    description:
      'Wind chimes tuned to the key and stirred by a draught, with a faint halo two octaves up, on a plate.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.5, tone: 0.6, width: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.2 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },

  // pedal-steel: steel played as if it were sung
  {
    id: 'stairwell-choir-steel-sung-high',
    name: 'Steel sung high',
    category: 'plucked',
    description:
      'A steel guitar swelled in on every note so it reads as a voice, slightly doubled, a faint octave rising behind.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 1.2, vibrato: 10, tone: 3400, volume: -3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 9, shimmer: 0.3, mix: 0.35 },
      },
    ],
    preview: 'line',
  },
  {
    id: 'stairwell-choir-steel-sung-by-grains',
    name: 'Steel sung by grains',
    category: 'plucked',
    description:
      'Long steel notes with no vibrato, sung again by a cloud of grains scattered to fifths and octaves, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1, volume: -7.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // string-machine: an ensemble keyboard for the long chords
  {
    id: 'stairwell-choir-slow-ensemble-strings',
    name: 'Slow ensemble strings',
    category: 'string',
    description:
      'A seventies string ensemble that takes three seconds to arrive, through a clean reel of tape, in a very large space.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 3, tone: 2200, width: 0.55, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, mix: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-thin-line-over-choir',
    name: 'Thin line over choir',
    category: 'string',
    description:
      'Only the top octave of the string ensemble, thin and bright, for the line above the choir, on a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1, tone: 8000, volume: -10 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // tanpura: a drone lute left going in the stairwell
  {
    id: 'stairwell-choir-stairwell-monochord',
    name: 'Stairwell monochord',
    category: 'drone',
    description:
      'Four open strings plucked round and round with no buzz at all, low and plain in a hard concrete stairwell.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 6, spread: 0.25, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { midDecay: 4, damping: 12000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'stairwell-choir-drone-lute-oo-return',
    name: 'Drone lute, oo return',
    category: 'drone',
    description:
      'A buzzing drone lute whose slow overtone sweeps come back from the reverb as a closed oo.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { jawari: 0.75, spread: 0.35, volume: -3.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 8, mix: 0.4 } }],
  },

  // thesis: noise tuned until it is nearly a voice
  {
    id: 'stairwell-choir-whistled-chord',
    name: 'Whistled chord',
    category: 'pad',
    description:
      'Narrow bands of noise that whistle the chord and its mirror, breathing slowly, in a very large space.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 67, resonance: 70, attack: 2, release: 5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Master', params: { ceiling: -9, gain: 3.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-mirror-breaths',
    name: 'Mirror breaths',
    category: 'texture',
    description:
      'Wide bands of noise around a note and its reflection, more breath than pitch, in a hall that turns them to ah.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { resonance: 30, width: 60, attack: 1, release: 4, mode: 2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Master', params: { ceiling: -9, gain: 5 } },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.45 } },
    ],
  },

  // tine-piano: an electric piano, kept soft
  {
    id: 'stairwell-choir-side-chapel-tines',
    name: 'Side chapel tines',
    category: 'keys',
    description:
      'A soft tine piano with no tremolo and almost no bark, strings swelling in behind it, in a still room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.3, bark: 0.1, decay: 1.6, release: 0.8, tone: 0.4, volume: -15 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Strings behind', params: { mix: 0.3 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 4, mix: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-overdubbed-tines',
    name: 'Overdubbed tines',
    category: 'keys',
    description:
      'Bell-like tines on a clean four-second loop: the broken chord returns under whatever is played next.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0, volume: -11.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 4, feedback: 0.8, wear: 0, wow: 0, spread: 0.1, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },

  // wavetable: vowels from a table, and the hum under them
  {
    id: 'stairwell-choir-wavetable-vowels',
    name: 'Wavetable vowels',
    category: 'pad',
    description:
      'A wavetable travelling slowly through sung vowels, bright, doubled thick to either side, on a long plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        motion: 0.9,
        rate: 0.04,
        attack: 3,
        release: 6,
        cutoff: 7000,
        spread: 0.35,
        volume: -12.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thick double', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'stairwell-choir-hum-that-breathes',
    name: 'Hum that breathes',
    category: 'pad',
    description:
      'Nearly plain sine tones over a sub, a dark hum that rises and falls like slow breathing, in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { sub: 0.6, cutoff: 900, attack: 3, release: 6, volume: -13 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.2, depth: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },

  // west-coast: the pulse under the later songs
  {
    id: 'stairwell-choir-pulse-under-voices',
    name: 'Pulse under voices',
    category: 'keys',
    description:
      'Soft folded plucks repeated by three tape heads into a steady pulse, the kind that sits under held voices.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 1.2, colour: 0.45, chance: 0.05, volume: 0 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 400, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stairwell-choir-folded-tone-held',
    name: 'Folded tone held',
    category: 'pad',
    description:
      'A tone that folds brighter as it swells in, with the slow phasing of a half-hertz shift, in a very large space.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 2.5, sustain: 0.9, drift: 0.6, volume: -14.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },

  // zither: open strings that keep ringing
  {
    id: 'stairwell-choir-chord-zither-hymn',
    name: 'Chord zither hymn',
    category: 'plucked',
    description:
      'A chord zither strummed as open fifths and octaves, a slow pad of strings rising behind the strums, in a cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 180, decay: 9, volume: -5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 2.5, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'stairwell-choir-loft-hammers',
    name: 'Loft hammers',
    category: 'plucked',
    description:
      'Strings rolled with small hammers into a shimmer, a looper holding the last few seconds, in a reverb that swells.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 7, volume: -10 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 3, mix: 0.3 } },
      { deviceId: 'shaped-reverb', preset: 'Slow bloom', params: { mix: 0.35 } },
    ],
  },
]
