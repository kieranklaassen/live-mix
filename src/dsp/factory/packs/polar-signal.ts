import { type FactoryPreset } from '../types'

// A town above the tree line in the dark season: short loops of borrowed sound going
// round in cold air, a radio that comes and goes, low hums, far bells and a horn across the water.

export const PRESETS: readonly FactoryPreset[] = [
  // sampler: written for whatever is loaded; the previews play its built-in soft tone
  {
    id: 'polar-signal-orchestra-fragment',
    name: 'Orchestra fragment',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down on a short loop through early converters, looped again in a cold space.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: {
        start: 0.3,
        end: 0.58,
        crossfade: 180,
        attack: 0.9,
        release: 3.5,
        tone: 2600,
        wobble: 0.35,
        volume: -16.5,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 14000 } },
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { length: 3, mix: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.35, decay: 12, highCut: 4500 },
      },
    ],
  },
  {
    id: 'polar-signal-night-band-voice',
    name: 'Night band voice',
    category: 'keys',
    description:
      'The loaded sound played once per key over a night radio link, thin and fading, the last minute echoing back.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { release: 1.4, tone: 5200, velocity: 0.6, volume: -11 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { fading: 0.4, static: 0.22, bandwidth: 0.45, mix: 0.85 },
      },
      { deviceId: 'echo-memory', preset: 'Distant minute', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'polar-signal-reversed-arrival',
    name: 'Reversed arrival',
    category: 'keys',
    description:
      'The loaded sound an octave down and backwards, swelling into each key through a dark reversed room and static.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { tune: -12, attack: 0.3, release: 2.5, tone: 4200, wobble: 0.3, volume: -11.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.45 } },
      { deviceId: 'noise-floor', preset: 'Between stations', params: { level: -46 } },
    ],
  },
  {
    id: 'polar-signal-slowed-hum',
    name: 'Slowed hum',
    category: 'drone',
    description:
      'A short stretch of the loaded sound two octaves down, run back and forth through a transformer into a dull hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: { tune: -24, attack: 2.5, release: 6, tone: 900, wobble: 0.15, volume: -11 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, damping: 0.7 } },
    ],
    preview: 'hold',
  },
  {
    id: 'polar-signal-locked-groove',
    name: 'Locked groove',
    category: 'keys',
    description:
      'A sliver of the loaded sound pressed to a worn record, crackle and all, caught and repeated in a small room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        start: 0.22,
        end: 0.4,
        crossfade: 15,
        attack: 0.02,
        release: 0.9,
        tone: 3600,
        wobble: 0.3,
        volume: -14.5,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { warp: 0.3, pops: 0.2 } },
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.2, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-half-speed-reel',
    name: 'Half speed reel',
    category: 'pad',
    description:
      'The loaded sound on unsteady tape with its own octave below at half speed, layering on a slow loop.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Worn tape',
      params: { crossfade: 250, attack: 0.5, release: 3, tone: 2800, wobble: 0.6, volume: -15 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 4000, mix: 0.55 } },
      {
        deviceId: 'tape-loop',
        preset: 'Long horizon',
        params: { length: 6, feedback: 0.6, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000, lowCut: 40 } },
    ],
  },
  {
    id: 'polar-signal-under-the-ice',
    name: 'Under the ice',
    category: 'texture',
    description:
      'The loaded sound an octave down, starved to a few swirling partials and smeared, as if heard through ice.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: {
        start: 0.4,
        end: 0.75,
        attack: 2.5,
        release: 6,
        tone: 1800,
        wobble: 0.45,
        volume: -18,
      },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater' },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.5, mix: 0.5 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.3, lowCut: 60, highCut: 3000, width: 0.7 },
      },
    ],
  },

  // wavetable
  {
    id: 'polar-signal-hollow-chord-over-sub',
    name: 'Hollow chord over sub',
    category: 'pad',
    description:
      'A hollow, dark chord over a sub octave that swells in over seconds, on tape in a very large space.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: {
        position: 0.3,
        motion: 0.5,
        rate: 0.05,
        sub: 0.4,
        cutoff: 1000,
        resonance: 0.2,
        attack: 4,
        release: 8,
        volume: -12.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.4, highCut: 5000, width: 0.7 },
      },
    ],
  },
  {
    id: 'polar-signal-sub-under-snow',
    name: 'Sub under snow',
    category: 'drone',
    description:
      'Two slowly beating sines and their sub octave with the filter nearly shut, in the rumble of an empty room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { detune: 6, sub: 0.85, cutoff: 420, attack: 3, release: 7, volume: -18 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue' },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'polar-signal-signal-through-snow',
    name: 'Signal through snow',
    category: 'pad',
    description:
      'A thin glass tone sent over sideband radio, a little off pitch and fading, its echoes far away.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.55,
        motion: 0.3,
        rate: 0.2,
        detune: 5,
        sub: 0,
        cutoff: 3200,
        attack: 0.6,
        release: 2.5,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Sideband voices', params: { tuning: 0.15, static: 0.2 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'polar-signal-platform-speaker',
    name: 'Platform speaker',
    category: 'pad',
    description:
      'Slow vowel shapes played through a horn loudspeaker across an empty platform, into a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        position: 0.4,
        motion: 0.6,
        rate: 0.07,
        cutoff: 2600,
        attack: 1.8,
        release: 4,
        spread: 0.5,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { room: 0.45, noise: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'polar-signal-frost-forming',
    name: 'Frost forming',
    category: 'pad',
    description:
      'A thin, high shifting spectrum that forms slowly with no bass under it, phasing in a falling winter tail.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: {
        position: 0.7,
        motion: 0.8,
        rate: 0.04,
        sub: 0,
        cutoff: 6000,
        attack: 4,
        release: 10,
        spread: 0.6,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 300 } },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'polar-signal-cold-arpeggio',
    name: 'Cold arpeggio',
    category: 'keys',
    description:
      'A short reedy synth note with a resonant filter, for patterns: dark bucket-brigade repeats and a small plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.35,
        motion: 0.25,
        rate: 0.4,
        detune: 5,
        sub: 0.3,
        cutoff: 1500,
        resonance: 0.4,
        attack: 0.008,
        release: 0.7,
        spread: 0.4,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },

  // atmosphere
  {
    id: 'polar-signal-mountain-pass-wind',
    name: 'Mountain pass wind',
    category: 'texture',
    description:
      'A low, heavy wind with slow gusts and the top taken off, its echoes coming back from far rock.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.55,
        movement: 0.7,
        tone: 0.35,
        resonance: 0.1,
        size: 0.6,
        attack: 3,
        release: 7,
        width: 0.6,
        volume: 0.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { lowCut: 60, highCut: 6000 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-rigging-wind',
    name: 'Rigging wind',
    category: 'texture',
    description:
      'Gusts that whistle on the held note like wind through wires, with worn tape echoes in a dark well.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: {
        density: 0.5,
        movement: 0.9,
        tone: 0.55,
        resonance: 0.8,
        size: 0.3,
        attack: 1.5,
        release: 5,
        width: 0.7,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.2 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-black-water',
    name: 'Black water',
    category: 'texture',
    description:
      'Slow dull waves against a harbour wall at night, low-passed until only their weight is left, in a hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: {
        density: 0.4,
        movement: 0.8,
        tone: 0.3,
        size: 0.6,
        attack: 3,
        width: 0.8,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 900 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-hut-roof-sleet',
    name: 'Hut roof sleet',
    category: 'texture',
    description:
      'Dense hard drops on a roof, recorded from inside a small room and pressed flat by tape.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: {
        density: 0.7,
        movement: 0.5,
        tone: 0.65,
        size: 0.1,
        attack: 2,
        release: 4,
        width: 0.6,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      {
        deviceId: 'tape',
        preset: 'Mastering deck',
        params: { drive: 0.8, hiss: 0.1, output: 0.2 },
      },
    ],
  },
  {
    id: 'polar-signal-run-out-groove',
    name: 'Run-out groove',
    category: 'texture',
    description:
      'The crackle and rumble of a record after the music has ended, caught in a short loop that keeps coming round.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: {
        density: 0.85,
        movement: 0.6,
        tone: 0.45,
        attack: 0.2,
        release: 1.5,
        width: 0.5,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 18, outputGain: -9 } },
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 1.8, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'polar-signal-unsteady-mains-hum',
    name: 'Unsteady mains hum',
    category: 'texture',
    description:
      'An unsteady mains hum tuned to the keys held, through tape saturation, heard in a small dark room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: {
        density: 0.6,
        movement: 0.5,
        tone: 0.3,
        resonance: 0.35,
        size: 0.4,
        attack: 2,
        release: 5,
        width: 0.5,
        volume: -23.5,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -2 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'polar-signal-hut-fire',
    name: 'Hut fire',
    category: 'texture',
    description:
      'A small fire ticking and settling close to the microphone, on cassette in a small room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.5, tone: 0.4, size: 0.2, width: 0.6, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // modal-bells
  {
    id: 'polar-signal-buoy-bell',
    name: 'Buoy bell',
    category: 'bell',
    description:
      'A dull harbour bell struck softly, with its own octave below at half speed, heard from across the water.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        decay: 14,
        damping: 0.6,
        hardness: 0.45,
        brightness: 0.35,
        spread: 0.3,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'polar-signal-ice-bowl',
    name: 'Ice bowl',
    category: 'bell',
    description:
      'A bowl rubbed until it sings, soft and beating, its spectrum left hanging in a cathedral.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: {
        decay: 16,
        hardness: 0.15,
        detune: 1.2,
        brightness: 0.35,
        release: 0.2,
        spread: 0.5,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.6, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'polar-signal-glass-in-frost',
    name: 'Glass in frost',
    category: 'bell',
    description:
      'Struck glass with a wide beat, each note coming back reversed from a short loop into a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { decay: 7, hardness: 0.35, detune: 2, sustain: 0, brightness: 0.55, volume: -1.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Backwards bed', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3, damping: 0.5 } },
    ],
  },
  {
    id: 'polar-signal-lost-music-box',
    name: 'Lost music box',
    category: 'bell',
    description:
      'A music box comb through a ten-bit sampler, with dull pieces of the last minute coming back under it.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 4, hardness: 0.6, brightness: 0.45, volume: -1 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty sampler', params: { jitter: 0.4, drive: 3 } },
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'polar-signal-ship-gong',
    name: 'Ship gong',
    category: 'bell',
    description:
      'A gong struck firmly and left to sink, its long tail falling in pitch and darkening as it goes.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { decay: 20, damping: 0.4, hardness: 0.5, brightness: 0.6, volume: -2 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } }],
    preview: 'keys',
  },
  {
    id: 'polar-signal-bars-on-vinyl',
    name: 'Bars on vinyl',
    category: 'bell',
    description:
      'Soft vibraphone bars left to ring, lifted from a worn pressing with its crackle, in a small room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 9, hardness: 0.25, release: 0.2, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'New pressing',
        params: { surface: 0.2, crackle: 0.35, wear: 0.4, tone: -0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'polar-signal-coast-station-pips',
    name: 'Coast station pips',
    category: 'bell',
    description:
      'Short dry thumb-piano notes sent as a narrow radio signal with whistles, murky repeats behind them.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 1.6, damping: 0.6, hardness: 0.7, brightness: 0.6, volume: -5 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Numbers',
        params: { fading: 0.25, static: 0.15, interference: 0.4 },
      },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { time: 500, mix: 0.3 } },
    ],
  },

  // drone
  {
    id: 'polar-signal-under-the-harbour',
    name: 'Under the harbour',
    category: 'drone',
    description:
      'Stacked octaves over a heavy sub with the filter almost shut, through a tape preamp: more felt than heard.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        partials: 0.4,
        wave: 0.6,
        movement: 0.4,
        sub: 0.9,
        cutoff: 320,
        attack: 5,
        volume: -23,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'polar-signal-fog-bank',
    name: 'Fog bank',
    category: 'drone',
    description:
      'A cluster of close sines and tuned air that gathers over several seconds, dulled and hung in a huge space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: {
        partials: 0.6,
        movement: 0.8,
        rate: 0.05,
        air: 0.6,
        cutoff: 900,
        attack: 8,
        width: 0.6,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { lowCut: 50, highCut: 5000 } },
      { deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.4, width: 0.7 } },
    ],
    preview: 'hold',
  },
  {
    id: 'polar-signal-noon-twilight',
    name: 'Noon twilight',
    category: 'drone',
    description:
      'A just minor chord of dark partials over a sub, layering on a loop between two decks and sinking.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: {
        partials: 0.6,
        wave: 0.5,
        sub: 0.2,
        air: 0.25,
        cutoff: 2500,
        attack: 5,
        volume: -4.2,
      },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { feedback: 0.65, mix: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { interval: 3, mix: 0.4 } },
    ],
  },
  {
    id: 'polar-signal-carrier-wave',
    name: 'Carrier wave',
    category: 'drone',
    description:
      'One plain steady tone picked up slightly off the station, with whistles and static, in a hall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        shape: 0,
        partials: 0.3,
        wave: 0,
        movement: 0.2,
        sub: 0,
        air: 0,
        attack: 1.5,
        release: 4,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Off the dial',
        params: { tuning: 0.3, fading: 0.4, static: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'polar-signal-singing-wires',
    name: 'Singing wires',
    category: 'drone',
    description:
      'The harmonic series of one note, every partial restless, like wires humming in wind between bending walls.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        partials: 0.9,
        wave: 0.35,
        movement: 1,
        rate: 0.3,
        sub: 0,
        air: 0.3,
        cutoff: 2800,
        attack: 3,
        width: 0.6,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Bending walls', params: { mix: 0.35 } }],
    preview: 'hold',
  },
  {
    id: 'polar-signal-generator-shed',
    name: 'Generator shed',
    category: 'drone',
    description:
      'A buzzing low unison with a slow uneven throb, heard through a loudspeaker from down a corridor.',
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        wave: 0.8,
        movement: 0.5,
        rate: 0.1,
        sub: 0.7,
        air: 0.05,
        cutoff: 450,
        attack: 2,
        release: 5,
        hold: 0,
        width: 0.5,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Sea swell',
        params: { rate: 0.8, depth: 0.35, phase: 0 },
      },
      { deviceId: 're-amp', preset: 'Down the hall', params: { room: 0.7 } },
    ],
  },
  {
    id: 'polar-signal-sun-returns',
    name: 'Sun returns',
    category: 'drone',
    description:
      'A just major chord of soft tones and air, smeared by slow grains into a cathedral: the first light in weeks.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { partials: 0.6, air: 0.4, cutoff: 3500, attack: 4, width: 0.7, volume: -8.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },

  // ember
  {
    id: 'polar-signal-sodium-lamps',
    name: 'Sodium lamps',
    category: 'pad',
    description:
      'Two detuned saws under a slow low-pass, warm and plain, on tape with a hall behind: a synth pad for the bed.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { cutoff: 900, ampAttack: 2, ampRelease: 6, lfo1Rate: 0.08, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, hiss: 0.15 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'polar-signal-engine-below-deck',
    name: 'Engine below deck',
    category: 'drone',
    description:
      'A saw and a pulse an octave apart over a sub, behind a low-pass that slowly opens and closes with some drive.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { subLevel: 0.4, cutoff: 1000, ampAttack: 2.5, volume: -11 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub Sweep',
        params: { cutoffHz: 1400, resonance: 2, driveDb: 3, lfoAmount: 30, lfoRateHz: 0.07 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, damping: 0.6 } },
    ],
  },
  {
    id: 'polar-signal-sub-bass-note',
    name: 'Sub bass note',
    category: 'keys',
    description:
      'A sine and its sub octave, one note at a time with a soft edge, for slow bass lines under a loop.',
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: { ampAttack: 0.03, ampRelease: 0.7, glide: 0.06, volume: -16.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 6 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'low',
  },
  {
    id: 'polar-signal-snowplough-passing',
    name: 'Snowplough passing',
    category: 'texture',
    description:
      'Filtered noise that sweeps up as it comes near and falls back, with echoes off far buildings.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        cutoff: 160,
        resonance: 0.45,
        filterEnvAmount: 0.7,
        filterAttack: 3,
        filterDecay: 3,
        ampAttack: 2,
        ampRelease: 3,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'polar-signal-sampled-glass',
    name: 'Sampled glass',
    category: 'pad',
    description:
      'A triangle and a thin pulse an octave up, through twelve-bit converters, with its own loop running under it.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { cutoff: 2200, ampAttack: 1.2, ampRelease: 5, unisonSpread: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit' },
      {
        deviceId: 'micro-looper',
        preset: 'Soft bed',
        params: { length: 2.6, tone: 5000, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.6 } },
    ],
  },
  {
    id: 'polar-signal-beacon',
    name: 'Beacon',
    category: 'bell',
    description:
      'A short sine ping with a twelfth above it, repeated by three tape heads and scattered as it falls away.',
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { ampDecay: 0.9, ampRelease: 0.9, velToAmp: 0.6, volume: 6 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 480, mix: 0.35 } },
      { deviceId: 'shaped-reverb', preset: 'Scattered echoes', params: { mix: 0.35 } },
    ],
  },

  // horns
  {
    id: 'polar-signal-foghorn',
    name: 'Foghorn',
    category: 'wind',
    description:
      'Low brass in a full section with a firm start, dulled and thrown a long way across open water.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.5, attack: 0.8, release: 3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3500 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.45, decay: 14 } },
    ],
    preview: 'low',
  },
  {
    id: 'polar-signal-fjord-horns',
    name: 'Fjord horns',
    category: 'wind',
    description:
      'A horn section that swells in over seconds, low-passed and half lost in a very large space.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.5, attack: 3, release: 5, volume: -8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 1200 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.5, width: 0.7 } },
    ],
    preview: 'chord',
  },
  {
    id: 'polar-signal-inner-groove-brass',
    name: 'Inner groove brass',
    category: 'wind',
    description:
      'A trumpet section chord lifted from a worn inner groove, low-passed and looped unsteadily at a slower clock.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.5, attack: 0.3, release: 1.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Inner groove', params: { tone: -0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { air: -6, highCut: 3000 } },
      { deviceId: 'micro-looper', preset: 'Drifting memory', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'polar-signal-radio-trumpet',
    name: 'Radio trumpet',
    category: 'wind',
    description:
      'One muted trumpet line from a small medium-wave set in the next room, thin and boxy, with a little static.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.45, attack: 0.1, release: 1.1, vibrato: 0.25, volume: -6.5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { fading: 0.2, static: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'polar-signal-cold-breath-horn',
    name: 'Cold breath horn',
    category: 'wind',
    description:
      'A single flugelhorn played very softly, more air than note, on a worn cassette in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.25, breath: 0.7, attack: 0.4, release: 2, vibrato: 0.15, volume: -2.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'polar-signal-two-ships',
    name: 'Two ships',
    category: 'wind',
    description:
      'Low brass in short blasts with a second horn a fifth above, each coming back from a tape loop and far echoes.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: {
        blow: 0.65,
        section: 0.5,
        attack: 0.35,
        release: 2.5,
        harmony: 0.5,
        volume: -2.2,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 5, feedback: 0.5, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },

  // tape-orchestra
  {
    id: 'polar-signal-slowed-string-loop',
    name: 'Slowed string loop',
    category: 'string',
    description:
      'Strings on worn tape at half speed behind a slowly moving low-pass, looped again in a large space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { speed: 1, age: 0.5, tone: -0.4, attack: 1.2, release: 3, volume: -9 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { slope: 1, cutoffHz: 1400, lfoAmount: 25, lfoRateHz: 0.06 },
      },
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 3.5, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.8 } },
    ],
  },
  {
    id: 'polar-signal-warped-record-cellos',
    name: 'Warped record cellos',
    category: 'string',
    description:
      'A low cello tape at half speed, pressed to a slow warped record with crackle, in a dark hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { tone: -0.2, hiss: 0.1, volume: -9 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter', params: { crackle: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3, damping: 3500 } },
    ],
    preview: 'low',
  },

  // choir
  {
    id: 'polar-signal-voices-in-static',
    name: 'Voices in static',
    category: 'voice',
    description:
      'Low wordless voices on a far station, sinking under the static and coming back, in a very large space.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { ensemble: 0.4, attack: 1.2, release: 3, volume: -8 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Far station', params: { fading: 0.6, static: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, highCut: 5000 } },
    ],
  },
  {
    id: 'polar-signal-hymn-through-walls',
    name: 'Hymn through walls',
    category: 'voice',
    description:
      'A small choir on ah with its octave below, dissolved until no entry is heard and drowned in a cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        ensemble: 0.5,
        vibrato: 0,
        attack: 2,
        release: 5,
        tone: 3000,
        width: 0.2,
        volume: -14.3,
      },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad octave below', params: { mix: 0.4 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.1, mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // organ
  {
    id: 'polar-signal-unlit-chapel',
    name: 'Unlit chapel',
    category: 'organ',
    description:
      'Soft pipes with a slow beat that speak late and dull, on an old reel with dropouts, in a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { celeste: 0.35, tone: 1000, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Worn thin',
        params: { wow: 0.4, age: 0.6, hiss: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'polar-signal-pedal-left-on',
    name: 'Pedal left on',
    category: 'organ',
    description:
      'The low ranks and a little reed, a dull pedal tone with bellows under it, through a tape preamp in a breathing hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { sub: 0.75, octave: 0.5, reed: 0.2, celeste: 0.4, tone: 1800, volume: -17 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },

  // string-machine
  {
    id: 'polar-signal-sampled-ensemble',
    name: 'Sampled ensemble',
    category: 'string',
    description:
      'A slow dark string ensemble through twelve-bit converters, with a wandering loop of itself at three-quarter clock.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2.5, tone: 1300, volume: -7 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 11000 } },
      { deviceId: 'micro-looper', preset: 'Drifting memory', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.8 } },
    ],
  },
  {
    id: 'polar-signal-ferry-lounge-strings',
    name: 'Ferry lounge strings',
    category: 'string',
    description:
      'The low octave of a seventies string ensemble under a slow phaser, with dark bucket-brigade repeats.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.2, release: 3.5, tone: 1500, volume: -2.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // acoustic-guitar
  {
    id: 'polar-signal-looped-guitar',
    name: 'Looped guitar',
    category: 'plucked',
    description:
      'A steel-string guitar played with the flesh of the finger, each phrase going round on tape in a cold hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { nail: 0.25, sustain: 6, release: 3, tone: 0.45, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.6, spread: 0.4, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-cabin-guitar',
    name: 'Cabin guitar',
    category: 'plucked',
    description:
      'A nylon-string guitar under the thumb, close and woody, on a quarter-inch reel with the room rumbling behind it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { type: 1, sustain: 5, release: 2, tone: 0.4, strum: 25, volume: 2 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.2 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -42 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // aurora
  {
    id: 'polar-signal-ridge-lights',
    name: 'Ridge lights',
    category: 'pad',
    description:
      'A brass pad that starts dark and keeps opening while held, slowly swept by an eight-stage phaser in a huge space.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 600, lowCut: 80, attack: 2.5, release: 7, volume: -6 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep 8-Stage',
        params: { rate: 0.05, feedback: 35, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
  },
  {
    id: 'polar-signal-cold-iron-sky',
    name: 'Cold iron sky',
    category: 'pad',
    description:
      'A ring-modulated chord, clangorous, split a hertz or two apart left and right so it beats, in a damped hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 1200, attack: 1, swell: 0.3, ring: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Split sky', params: { fine: 1.5, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35, damping: 0.6 } },
    ],
  },

  // bowed-string
  {
    id: 'polar-signal-thin-ice-bow',
    name: 'Thin ice bow',
    category: 'string',
    description:
      'A light, slow bow with no vibrato, each note swelling back in reverse inside a cathedral.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 2, pressure: 0.2, vibrato: 0, volume: -4.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'polar-signal-hull-groan',
    name: 'Hull groan',
    category: 'string',
    description:
      'One low string bowed hard with no vibrato through a big wooden body, on tape in a small dark room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 1.5,
        release: 3,
        brightness: 0.3,
        pressure: 0.75,
        body: 0.9,
        vibrato: 0,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.15 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },

  // chamber-strings
  {
    id: 'polar-signal-quartet-under-snow',
    name: 'Quartet under snow',
    category: 'string',
    description:
      'A few slow dark bows with their own octave below at half speed, softly blurred, in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { players: 4, attack: 1.8, release: 3.5, vibrato: 0, volume: -10.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 5000, mix: 0.45 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.6, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-starved-stream-strings',
    name: 'Starved stream strings',
    category: 'string',
    description:
      'A muted section with no vibrato, its quiet detail thrown away by a starved stream, layering on slowed tape.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 2, release: 4, air: 0.15, volume: -8 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.6, highCut: 6000 } },
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 5, feedback: 0.6, mix: 0.4 },
      },
    ],
  },

  // chord-harp
  {
    id: 'polar-signal-stairwell-strum',
    name: 'Stairwell strum',
    category: 'plucked',
    description:
      'A slow dull strum over two octaves whose reverb falls away in a straight line, with tape hiss under it.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { strum: 60, span: 1, sustain: 5, tone: 0.3, pad: 0.15, volume: -5.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Straight fall', params: { time: 2.4, mix: 0.4 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
    ],
  },
  {
    id: 'polar-signal-station-chimes',
    name: 'Station chimes',
    category: 'plucked',
    description:
      'Single plucked chimes like the tune a station plays between programmes, over a fading night radio in a room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { sustain: 3, tone: 0.55, spread: 0.3, volume: -4 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { drift: 0.3, fading: 0.35, static: 0.25, bandwidth: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // clarinet
  {
    id: 'polar-signal-reed-in-fog',
    name: 'Reed in fog',
    category: 'wind',
    description:
      'A bass clarinet blown softly with a slow start, breathy and dark, its tape echoes going out on a long plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.4, breath: 0.6, attack: 0.8, release: 2, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 620, highCut: 3000, mix: 0.25 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3, damping: 0.55 } },
    ],
  },
  {
    id: 'polar-signal-clarinet-out-of-silence',
    name: 'Clarinet out of silence',
    category: 'wind',
    description:
      'A clarinet that fades in from silence over two seconds, with a backwards loop of itself and a falling tail.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.1, breath: 0.5, attack: 2, volume: -12.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Backwards bed', params: { length: 2.4, mix: 0.3 } },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { bloom: 0.4, mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // dusk
  {
    id: 'polar-signal-late-watch-pad',
    name: 'Late watch pad',
    category: 'pad',
    description:
      'A chorus-synth chord whose filter opens from nearly shut, through an early sampler, in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 400, envelope: 0.6, attack: 2.5, release: 6, volume: -10 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35, noise: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'polar-signal-road-tunnel',
    name: 'Road tunnel',
    category: 'pad',
    description:
      'A square wave and its full sub octave behind a low filter that moves a little, in a long dull plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 1500, resonance: 0.3, attack: 1.5, release: 5, chorus: 1, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 1700, resonance: 1.4, lfoAmount: 30, lfoRateHz: 0.09, lfoShape: 1 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.2, damping: 0.6 } },
    ],
    preview: 'low',
  },

  // felt-piano
  {
    id: 'polar-signal-piano-next-door',
    name: 'Piano next door',
    category: 'keys',
    description:
      'A heavily felted piano heard through a speaker down a corridor, dull and roomy, with the air of the room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0.15, resonance: 0, outputDb: -17 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { drive: 0.15, room: 0.6 } },
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -44 } },
    ],
  },
  {
    id: 'polar-signal-lounge-piano-loop',
    name: 'Lounge piano loop',
    category: 'keys',
    description:
      'A felt piano phrase off a dusty record with pops, caught in a short loop at a quarter clock, in a small room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.5, hardness: 0.45, reverbMix: 0.1, outputDb: -14 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { crackle: 0.6, pops: 0.35 } },
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 2, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // flute
  {
    id: 'polar-signal-snow-breath',
    name: 'Snow breath',
    category: 'wind',
    description:
      'Low flutes that are almost all air, held as a chord, with the top rolled off, in a hall that whispers back.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 1, blow: 0.12, attack: 2, release: 4, vibrato: 0, volume: -18 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { lowCut: 120, highCut: 7000 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering hall', params: { decay: 6, mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'polar-signal-bad-line-flute',
    name: 'Bad line flute',
    category: 'wind',
    description:
      'A wooden flute sent down a failing connection: swirling, with lost and stuck packets, into a hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.4, attack: 0.08, release: 1.2, vibrato: 0.25, volume: -8 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Bad connection',
        params: { dropouts: 0.2, stutter: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // fm-glass
  {
    id: 'polar-signal-icicles',
    name: 'Icicles',
    category: 'bell',
    description:
      'Small glass chimes with short flickers of the last few seconds scattered behind them, on a plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { brightness: 0.6, decay: 1.8, volume: -1.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-digital-frost-pad',
    name: 'Digital frost pad',
    category: 'pad',
    description:
      'A slow, soft FM pad with a wide beat, glazed by early converters and left on a long damped plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.22, attack: 2.5, release: 6, detune: 12, spread: 0.4, volume: -17.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 12000 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.22, damping: 0.5 } },
    ],
  },

  // grain-synth: written for whatever is loaded; the previews play its built-in soft tone
  {
    id: 'polar-signal-moment-held-still',
    name: 'Moment held still',
    category: 'pad',
    description:
      'One moment of the loaded sound held still as long grains, smeared and hung in a cathedral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        position: 0.5,
        size: 600,
        density: 10,
        attack: 2,
        release: 5,
        spread: 0.3,
        tone: 4000,
        volume: -23,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.4, mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.15, decay: 12 } },
    ],
  },
  {
    id: 'polar-signal-stretched-broadcast',
    name: 'Stretched broadcast',
    category: 'texture',
    description:
      'The loaded sound crawled through in long grains, some reversed, half of it sent over a night radio, in a hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { scan: 0.04, reverse: 0.3, attack: 1.5, release: 5, tone: 5000, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { fading: 0.5, static: 0.2, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // guitar
  {
    id: 'polar-signal-baritone-two-notes',
    name: 'Baritone, two notes',
    category: 'plucked',
    description:
      'A low electric guitar picked hard near the bridge, each note left a long time on dull tape in a very large space.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { sustain: 16, tone: 1600, strum: 40, warmth: 0.6, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, hiss: 0.15, tone: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.4, decay: 14, highCut: 4000, width: 0.8 },
      },
    ],
  },
  {
    id: 'polar-signal-muted-pulse',
    name: 'Muted pulse',
    category: 'plucked',
    description:
      'Short palm-muted guitar notes for a pattern, into tape saturation, with bucket-brigade repeats in a small dark room.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { sustain: 2.4, tone: 3000, volume: -6 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 15, outputDb: -5.5 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 333, feedback: 0.6, spread: 0.7, mix: 0.45 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },

  // handpan
  {
    id: 'polar-signal-oil-drum-slowed',
    name: 'Oil drum, slowed',
    category: 'bell',
    description:
      'A tongue drum played softly and heard mostly at half speed, an octave down and dulled, in a cave of echoes.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 5, touch: 0.2, shimmer: 0.15, volume: -2.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { highCut: 4000, mix: 0.7 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { highCut: 3500, mix: 0.35 } },
    ],
  },
  {
    id: 'polar-signal-skipping-hand-drum',
    name: 'Skipping hand drum',
    category: 'bell',
    description:
      'Damped taps on steel off a clean pressing that jumps its groove now and then, in a small room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { decay: 1.5, damp: 0.6, volume: -0.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing', params: { surface: 0.2, crackle: 0.3 } },
      { deviceId: 'glitch', preset: 'Skipping disc', params: { time: 140, chance: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },

  // harp
  {
    id: 'polar-signal-harp-under-dust',
    name: 'Harp under dust',
    category: 'plucked',
    description:
      'A concert harp off a dusty record, low-passed, with a half-speed loop of the phrase under it in a hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.4, touch: 0.3, halo: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Dusty record', params: { tone: 0.3 } },
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-harp-returning-reversed',
    name: 'Harp returning reversed',
    category: 'plucked',
    description:
      'Soft long-ringing harp strings, the whole phrase returning in reverse four seconds later, in a cathedral.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { decay: 2.2, halo: 0.8, volume: -4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { feedback: 0.3, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // ladder-bass
  {
    id: 'polar-signal-pulse-under-loops',
    name: 'Pulse under loops',
    category: 'keys',
    description:
      'A short round bass note with a soft filter snap and a strong sub, for a slow pattern, with one dark repeat.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Sequence bass',
      params: {
        sub: 0.5,
        cutoff: 320,
        emphasis: 0.4,
        contour: 0.5,
        decay: 0.9,
        drive: 0.2,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 450, feedback: 0.3, mix: 0.2 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'low',
  },
  {
    id: 'polar-signal-sub-slowly-closing',
    name: 'Sub, slowly closing',
    category: 'keys',
    description:
      'A low note that starts open and closes over seconds through a resonant filter, hot on tape, in a dark room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: { sub: 0.6, cutoff: 110, emphasis: 0.5, contour: 0.9, decay: 8, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: -4 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // mallets
  {
    id: 'polar-signal-marimba-next-hall',
    name: 'Marimba, next hall',
    category: 'bell',
    description:
      'A held marimba chord rolled with soft mallets into one shimmer, low-passed, in a reverb that swells after it.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.15, roll: 9, volume: -16 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 1500 } },
      { deviceId: 'shaped-reverb', preset: 'Slow bloom', params: { time: 3, mix: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'polar-signal-medium-wave-lullaby',
    name: 'Medium wave lullaby',
    category: 'bell',
    description:
      'A soft celesta on a medium-wave set with a storm coming: static rising whenever the signal sinks.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.25, decay: 1.4, damper: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Storm coming', params: { fading: 0.35, static: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // outdoors
  {
    id: 'polar-signal-thunder-over-ice',
    name: 'Thunder over ice',
    category: 'texture',
    description:
      'Far thunder with the top taken off, mostly low rolls, carrying across a very large space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.6, distance: 0.8, tone: 0.6, width: 0.7, volume: -3.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.8 } },
    ],
  },
  {
    id: 'polar-signal-brook-under-snow',
    name: 'Brook under snow',
    category: 'texture',
    description:
      'A thin stream running a little way off, steady, with the rumble and the top rolled off, in a small room.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.35, distance: 0.45, movement: 0.4, tone: 0.35, width: 0.7, volume: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 100, highCut: 3000 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // pedal-steel
  {
    id: 'polar-signal-steel-over-snow',
    name: 'Steel over snow',
    category: 'plucked',
    description:
      'A steel guitar with no vibrato and almost no pick, every note swelling in and hanging in an enormous space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, sustain: 30, tone: 1800, volume: -6 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Event horizon',
        params: { mix: 0.35, decay: 30, width: 0.8 },
      },
    ],
  },
  {
    id: 'polar-signal-slow-reel-steel',
    name: 'Slow reel steel',
    category: 'plucked',
    description:
      'Slow steel guitar with long glides on a reel whose speed wanders, its tail falling in pitch as it darkens.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { glide: 300, vibrato: 4, tone: 2600, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.7, hiss: 0.2 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { interval: 3, mix: 0.35 } },
    ],
  },

  // tanpura
  {
    id: 'polar-signal-long-plain-strings',
    name: 'Long plain strings',
    category: 'drone',
    description:
      'Four plain strings plucked in a slow round with no buzz, doubled a few cents apart, a bank of strings ringing on.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 9, body: 0.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'sympathetic', preset: 'Long resonance', params: { root: 2, mode: 2, mix: 0.4 } },
    ],
  },
  {
    id: 'polar-signal-far-buzzing-string',
    name: 'Far buzzing string',
    category: 'drone',
    description:
      'A buzzing drone lute from a far station, sliding off tune and sinking under static, in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.5, speed: 5, decay: 10, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Far station',
        params: { tuning: 0.1, drift: 0.4, fading: 0.7, static: 0.4, mix: 0.8 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // thesis
  {
    id: 'polar-signal-chimney-wind',
    name: 'Chimney wind',
    category: 'texture',
    description:
      'Broad low bands of noise that breathe slowly, like wind moaning in a chimney, in a hall that sings oh.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { center: 52, resonance: 18, attack: 2.5, mode: 1, breatheRate: 0.15 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 2 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'polar-signal-falling-whistlers',
    name: 'Falling whistlers',
    category: 'texture',
    description:
      'Narrow whistling bands of noise from one key whose echoes spiral down in pitch, in a hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 69, resonance: 80, attack: 0.6, release: 3, mode: 2 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 14, outputGain: -6.5 } },
      { deviceId: 'freq-shifter', preset: 'Falling spiral', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // tine-piano
  {
    id: 'polar-signal-vinyl-lounge-keys',
    name: 'Vinyl lounge keys',
    category: 'keys',
    description:
      'A dull electric piano with a slow tremolo, off a worn record with its crackle, with dark repeats.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 1.8, release: 0.8, tremolo: 0.25, tremoloRate: 1.2, volume: -16 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { crackle: 0.35, pops: 0.15 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'polar-signal-tines-thawing',
    name: 'Tines, thawing',
    category: 'keys',
    description:
      'Bell-like tines with a long sustain, each note swelling back in reverse a moment later, in a breathing hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.7, tone: 0.4, volume: -13.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1200, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.35 } },
    ],
  },

  // west-coast
  {
    id: 'polar-signal-window-lamp',
    name: 'Window lamp',
    category: 'pad',
    description:
      'Plain tones that fold over slowly as they swell and fall back to sines, wandering a little, on tape in a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.25, timbreEnv: 0.8, attack: 2.5, colour: 0.6, volume: -13 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'polar-signal-depth-sounder',
    name: 'Depth sounder',
    category: 'bell',
    description:
      'A nearly pure ping through a gate that darkens as it fades, answered by slow tape echoes from far away.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { fold: 0.05, fm: 0.02, decay: 0.9, colour: 0.5, chance: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 900, feedback: 0.55, highCut: 3000, mix: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.35 } },
    ],
  },

  // zither
  {
    id: 'polar-signal-hammer-on-wire',
    name: 'Hammer on wire',
    category: 'plucked',
    description:
      'One string struck with a felt hammer, its grain echoes falling an octave each time, on a long plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 7, brightness: 0.5, sympathy: 0.5, body: 2, volume: -10 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'polar-signal-strum-left-hanging',
    name: 'Strum left hanging',
    category: 'plucked',
    description:
      'A slow strum of doubled strings, caught and held as a dark even bed that glides to the next chord, in a hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { strum: 120, brightness: 0.45, volume: -5.5 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
]
