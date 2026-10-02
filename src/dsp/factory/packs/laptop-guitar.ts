import { type FactoryPreset } from '../types'

// A guitar played into a fuzz box and then into a laptop: chords ground down to grain, clicks and
// bright digital haze, with the tune still audible inside. Pedals come first, the patch after.

export const PRESETS: readonly FactoryPreset[] = [
  // guitar: the source of everything here, fuzzed first and then taken apart by the patch
  {
    id: 'laptop-guitar-sunburnt-chords',
    name: 'Sunburnt chords',
    category: 'plucked',
    description:
      'A slow-strummed chord through a pentode fuzz into a grain cloud: a bright fizzing haze with the tune still in it.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { pickup: 0.7, hardness: 0.5, sustain: 18, tone: 4400, strum: 45, volume: -10 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.7, push: 1, lowCut: 160, tone: 0.8, highCut: 11000, output: -6.5 },
      },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 160, density: 32, spray: 0.5, feedback: 0.4, mix: 0.6 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.7, tilt: 2, width: 0.7, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-deckchair-strum',
    name: 'Deckchair strum',
    category: 'plucked',
    description:
      'Clean neck-pickup notes that a skipping buffer repeats and drops like a scratched disc, with an amp spring behind.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.45, sustain: 7, strum: 28, warmth: 0.45, volume: 0 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Skipping disc',
        params: { time: 120, chance: 0.4, repeat: 0.5, calm: 0.3, spread: 0.4, mix: 0.7 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.22, width: 0.6 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-heat-haze-fuzz',
    name: 'Heat haze fuzz',
    category: 'plucked',
    description:
      'Twelve strings clipped hard by a fuzz pedal, then blurred across the spectrum and thinned by a starving stream.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { sustain: 16, strum: 40, volume: -12 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Fuzz Pedal',
        params: { driveDb: 26, toneDb: 3, outputDb: -17.5 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, smear: 0.9, tilt: 0.5, width: 0.4, mix: 0.65 },
      },
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.55, mix: 0.7 } },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-salt-pickups',
    name: 'Salt in the pickups',
    category: 'plucked',
    description:
      'Low strings picked by the bridge through a worn converter and a small speaker: a dull, gritty baritone.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { sustain: 14, tone: 1800, strum: 20, volume: -5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn converter', params: { rate: 8000, bits: 8 } },
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { drive: 0.5, treble: -0.4, room: 0.4, output: -1 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'laptop-guitar-buffer-freeze',
    name: 'Buffer held open',
    category: 'pad',
    description:
      'Swelled chords with no pick in them, smeared until each one hangs in the air like a soft organ.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1.6, sustain: 24, tone: 3200, volume: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.5, output: -4 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: {
          blur: 0.95,
          smear: 0.9,
          tilt: -1,
          lowCut: 40,
          highCut: 10000,
          shimmer: 0.3,
          width: 0.4,
          mix: 0.8,
        },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, decay: 8, width: 0.7 } },
    ],
  },
  {
    id: 'laptop-guitar-pier-lights',
    name: 'Pier lights',
    category: 'plucked',
    description:
      'Single bright notes whose repeats are rebuilt from grains an octave up and scattered left and right like glitter.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.6, position: 0.1, hardness: 0.7, tone: 4800, strum: 0, volume: 0 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 280, spray: 0.35, pitchSpray: 0.15, size: 60, spread: 1, mix: 0.45 },
      },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-stuck-bridge',
    name: 'Stuck on the bridge',
    category: 'plucked',
    description:
      'Short muted notes clipped by a console, caught by the buffer and repeated on the spot into a dark echo.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { hardness: 0.65, sustain: 2.2, tone: 4200, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Console edge',
        params: { drive: 0.7, push: 1, output: -4 },
      },
      {
        deviceId: 'glitch',
        preset: 'Stuck',
        params: { time: 110, chance: 0.5, decay: 0.35, spread: 0.5, mix: 0.8 },
      },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 330, mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-laptop-on-amp',
    name: 'Laptop on the amp',
    category: 'plucked',
    description:
      'A chord through a speaker on the edge of breaking up, recorded and sent down a line that drops and sticks.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { pickup: 0.4, hardness: 0.6, sustain: 12, tone: 3400, strum: 30, volume: -8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -3 } },
      {
        deviceId: 'low-bitrate',
        preset: 'Bad connection',
        params: { loss: 0.6, dropouts: 0.25, stutter: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-sideband-strum',
    name: 'Sideband strum',
    category: 'plucked',
    description:
      'A strummed chord with every partial pushed up a few hertz round a feedback loop, so it phases against itself.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.5, sustain: 14, strum: 55, shimmer: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Glowing triode', params: { drive: 0.6, output: -5 } },
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { fine: 2.5, feedback: 0.8, delay: 30, width: 0.6, mix: 0.55 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },

  // acoustic-guitar: strummed steel and nylon, chopped, crushed and replayed by the buffer
  {
    id: 'laptop-guitar-boardwalk-strum',
    name: 'Boardwalk strum',
    category: 'plucked',
    description:
      'A steel-string chord dragged slowly, with slices of it cut out, replayed and reversed as soft stumbles.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { nail: 0.7, sustain: 7, release: 3, strum: 70, volume: -9 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Gentle stumble',
        params: { time: 180, chance: 0.45, reverse: 0.5, spread: 0.5, mix: 0.75 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-nylon-noise',
    name: 'Nylon under noise',
    category: 'plucked',
    description:
      'Round nylon notes pushed into a tape preamp, with radio static that rises and falls with every pluck.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.35, sustain: 7, volume: -3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.55, output: -4 } },
      {
        deviceId: 'noise-floor',
        preset: 'Rides the sound',
        params: { type: 5, level: -30, response: 0.3, tone: 0.3 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-twelve-glitter',
    name: 'Twelve string glitter',
    category: 'plucked',
    description:
      'A twelve-string strum, lightly clipped, shattered into tiny grains an octave up that fall back over it in a plate.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 50, sustain: 8, release: 4, volume: -7 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Warm Glue',
        params: { driveDb: 14, toneDb: 2, outputDb: -8 },
      },
      {
        deviceId: 'grain-cloud',
        preset: 'Glass shards',
        params: { size: 36, density: 22, feedback: 0.35, mix: 0.5 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.22 } },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-chopped-fingers',
    name: 'Chopped fingerstyle',
    category: 'plucked',
    description:
      'Picked steel strings with a hard-edged tenth-of-a-second chop replaying each note an octave down beside it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { position: 0.12, nail: 0.8, sustain: 4, tone: 0.7, strum: 0, volume: -1 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Short stutter',
        params: { length: 100, jitter: 0.5, mix: 0.5 },
      },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 210, mix: 0.22 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-ring-dissolve',
    name: 'Ringing dissolve',
    category: 'plucked',
    description:
      'Open steel strings left to ring and dissolved into a dark wash, heard as if under water down a thin line.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { nail: 0.3, tone: 0.45, strum: 30, volume: -9 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { tilt: -2.5, highCut: 5000, width: 0.3, mix: 0.75 },
      },
      {
        deviceId: 'low-bitrate',
        preset: 'Underwater',
        params: { loss: 0.6, stereo: 0.3, highCut: 3500 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-postcard-nylon',
    name: 'Postcard nylon',
    category: 'plucked',
    description:
      'A thumbed nylon guitar sampled at twelve bits, each phrase handed back in reverse a moment later.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { type: 1, sustain: 5, release: 2, strum: 35, volume: 3.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { drive: 0.4, wear: 0.5 } },
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 750, feedback: 0.25, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-muted-clicks',
    name: 'Bridge clicks',
    category: 'plucked',
    description:
      'Muted plucks by the bridge folded by a low sample rate into metal ticks, then scattered by a grain delay.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { nail: 0.85, sustain: 2.5, release: 0.4, tone: 0.7, volume: 2 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Folded metal',
        params: { rate: 7000, drive: 22, mix: 0.9 },
      },
      {
        deviceId: 'grain-delay',
        preset: 'Grain cloud',
        params: { time: 190, pitchSpray: 0.05, feedback: 0.55, mix: 0.5 },
      },
    ],
    preview: 'keys',
  },

  // pedal-steel: a slide guitar for the long melting lines, fed to the same patch
  {
    id: 'laptop-guitar-slide-static',
    name: 'Slide into fuzz',
    category: 'plucked',
    description:
      'Steel chords swelled in through a glowing triode and blurred, so the pedal bends smear across a wide space.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.8, sustain: 20, vibrato: 5, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Glowing triode',
        params: { drive: 0.7, push: 1, highCut: 6500, output: -9 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { blur: 0.75, mix: 0.55 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-lap-grain',
    name: 'Lap steel grains',
    category: 'plucked',
    description:
      'A bright lap steel picked hard, its slides torn into a soft cloud of grains with a dripping spring behind.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { sustain: 10, glide: 300, volume: -6 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 120, density: 26, scatter: 0.15, reverse: 0.4, mix: 0.55 },
      },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.22 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-still-steel',
    name: 'Still steel drift',
    category: 'pad',
    description:
      'Steel strings without vibrato, faded in slowly on warm tape and set drifting by a shift of under a hertz.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.8, tone: 2400, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { drive: 0.7, hiss: 0.1, output: -6 } },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 0.7, mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'laptop-guitar-long-slide-smear',
    name: 'Backwards slides',
    category: 'plucked',
    description:
      'One string sliding up to an octave between notes, each slide answered by reversed grains in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.3, glide: 650, pick: 0.55, volume: -6 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Backwards shards',
        params: { time: 520, size: 320, feedback: 0.45, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'laptop-guitar-picked-bits',
    name: 'Picked bell bits',
    category: 'bell',
    description:
      'Hard-picked steel notes through an unfiltered converter whose images ring above them, stacked again in octaves.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 5, vibrato: 0, volume: -5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glass images', params: { rate: 10000 } },
      {
        deviceId: 'cascade',
        preset: 'Glass rain',
        params: { time: 170, repeats: 6, decay: 0.4, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-singing-fuzz',
    name: 'Singing steel fuzz',
    category: 'plucked',
    description:
      'A slide lead with a deep bar vibrato through a pentode fuzz and tape echo: one sustained, biting voice.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.5, vibrato: 18, tone: 3600, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.75, output: -1 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 420, mix: 0.28 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'laptop-guitar-steel-glass',
    name: 'Steel behind glass',
    category: 'pad',
    description:
      'Swelled steel chords with their phases scattered by a starving stream, under a thin two-octave halo.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: {
        swell: 1.2,
        sustain: 25,
        glide: 260,
        vibrato: 4,
        pick: 0.25,
        tone: 4000,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Smeared phases', params: { loss: 0.65, mix: 0.85 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3, decay: 8 } },
    ],
  },

  // grain-synth: the granular patch itself; load a strummed chord and play it apart
  {
    id: 'laptop-guitar-chord-in-grains',
    name: 'Chord in grains',
    category: 'pad',
    description:
      'Whatever is loaded, held as a dense cloud of short grains and pushed into a fuzz: made for a strummed chord.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Cloud',
      params: {
        position: 0.25,
        scan: 0.04,
        size: 150,
        density: 12,
        spray: 0.4,
        attack: 0.3,
        release: 3,
        tone: 12000,
        volume: -14,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.65, tone: 0.3, highCut: 10000, output: -5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-frozen-strum',
    name: 'Frozen strum',
    category: 'pad',
    description:
      'One instant of the loaded sound held still, its quiet detail thrown away by a thin stream, then blurred.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { position: 0.3, size: 500, density: 10, attack: 0.8, release: 4, volume: -20 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.65, frame: 2 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, width: 0.6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'laptop-guitar-stutter-patch',
    name: 'Stutter patch',
    category: 'keys',
    description:
      'Single hard-edged grains stepping quickly through the loaded sound, crushed to a few bits: a rattling stutter.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: {
        position: 0.15,
        scan: 0.8,
        size: 60,
        density: 2,
        shape: 0.9,
        release: 0.4,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed', params: { bits: 6, drive: 6 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-octave-fizz',
    name: 'Octave fizz',
    category: 'pad',
    description:
      'The loaded sound as a bright cloud with most grains thrown up an octave and a clipped edge mixed in, in a plate.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: {
        position: 0.4,
        size: 220,
        density: 12,
        octaves: 0.85,
        attack: 1,
        release: 4,
        tone: 16000,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Parallel Shine', params: { mix: 0.5, outputDb: -24 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-reverse-tide',
    name: 'Tide going out',
    category: 'texture',
    description:
      'Long reversed grains creeping backwards through the loaded sound, shifted a few hertz down a falling spiral.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { position: 0.5, scan: -0.15, size: 1100, spray: 0.25, spread: 0.6, volume: -17 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Falling spiral',
        params: { fine: 3, feedback: 0.7, width: 0.6, mix: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.7 } },
    ],
  },
  {
    id: 'laptop-guitar-slow-scan',
    name: 'Slow scan',
    category: 'texture',
    description:
      'The loaded sound read at a twentieth of its speed and its own pitch, each grain echoed again in reverse.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Slow stretch',
      params: {
        scan: 0.05,
        size: 380,
        density: 9,
        spray: 0.08,
        attack: 0.6,
        release: 2.5,
        spread: 0.4,
        tone: 9000,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Backwards shards',
        params: { time: 600, feedback: 0.4, mix: 0.35 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-click-field',
    name: 'Click field',
    category: 'texture',
    description:
      'Fifteen-millisecond grains picked from all over the loaded sound: a field of clicks with the pitch just audible.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: {
        position: 0.5,
        scan: 0,
        size: 15,
        density: 9,
        spray: 1,
        octaves: 0.3,
        shape: 1,
        attack: 0.05,
        release: 1.2,
        spread: 1,
        volume: -8.5,
      },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Lo-fi quarter',
        params: { length: 0.6, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // sampler: a bar lifted from an old record or a take of the guitar, looped and worn down
  {
    id: 'laptop-guitar-borrowed-bar',
    name: 'Borrowed bar',
    category: 'keys',
    description:
      'Whatever is loaded, looped through the converters of an early sampler and made to skip: try a bar of a pop song.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: {
        start: 0.1,
        end: 0.6,
        crossfade: 15,
        attack: 0.005,
        release: 0.9,
        wobble: 0.1,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty sampler', params: { jitter: 0.5, drive: 6 } },
      {
        deviceId: 'glitch',
        preset: 'Skipping disc',
        params: { time: 140, chance: 0.35, repeat: 0.6, mix: 0.7 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'laptop-guitar-looped-chord',
    name: 'One chord looped',
    category: 'pad',
    description:
      'A short stretch of the loaded sound looped until it is a tone, driven through a console and blurred to a haze.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { start: 0.3, end: 0.42, crossfade: 30, attack: 0.4, release: 3, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Console edge',
        params: { drive: 0.7, push: 1, tone: 0.4, output: -9 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.75, tilt: 0.5, width: 0.6, mix: 0.6 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-half-remembered',
    name: 'Half the song',
    category: 'pad',
    description:
      'The loaded sound an octave down with only what a starving stream discards left of it, in a hall: a dim ghost.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { wobble: 0.35, tone: 5000, volume: -18 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Ghost', params: { loss: 0.6, frame: 2, smear: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'laptop-guitar-reversed-take',
    name: 'Reversed take',
    category: 'texture',
    description:
      'The loaded sound played backwards so it swells into each key, then scattered by a cloud of half-reversed grains.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { attack: 0.05, release: 2, tone: 10000, volume: -8 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 300, density: 14, reverse: 0.5, feedback: 0.45, mix: 0.6 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-loop-shard',
    name: 'Loop shard',
    category: 'bell',
    description:
      'A sliver of the loaded sound run back and forth and shifted by a fixed number of hertz, so it rings like metal.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: {
        start: 0.4,
        end: 0.45,
        crossfade: 5,
        tune: 0,
        attack: 0.002,
        release: 1.8,
        tone: 9000,
        wobble: 0.05,
        velocity: 0.6,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { shift: 171, mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-folded-loop',
    name: 'Loop through the amp',
    category: 'pad',
    description:
      'A loop of the loaded sound an octave down, folded over on itself by a wavefolder and played through a combo in a room.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { tune: -12, attack: 0.2, release: 2, tone: 6000, wobble: 0.3, volume: -12 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Wavefold Lead',
        params: { driveDb: 12, toneDb: 0, outputDb: -16.5 },
      },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.4, room: 0.55 } },
    ],
  },
  {
    id: 'laptop-guitar-sped-up-take',
    name: 'Sped-up take',
    category: 'bell',
    description:
      'The loaded sound played once an octave up, with a double-speed loop of it sparkling above and a small plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { tune: 12, release: 1, tone: 12000, velocity: 0.7, volume: -6 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave sparkle', params: { length: 0.8, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // wavetable: the synth layer under the guitar, treated as roughly as the guitar is
  {
    id: 'laptop-guitar-skipping-chord',
    name: 'Skipping chord',
    category: 'pad',
    description:
      'A reed-organ chord cut into hard stuck repeats, like a disc that cannot get past one bar, in a small plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.35, cutoff: 3600, attack: 0.02, release: 0.8, volume: -12 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Stuck',
        params: { time: 140, chance: 0.75, calm: 0, decay: 0.1, spread: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-glass-gain',
    name: 'Glass under gain',
    category: 'pad',
    description:
      'The glass table folded over by a wavefolder until it fizzes, then hung in a spectral blur.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { position: 0.5, motion: 0.6, cutoff: 6000, attack: 0.6, volume: -14 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Wavefold Lead',
        params: { driveDb: 14, toneDb: 3, outputDb: -14 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.7, width: 0.6, mix: 0.55 },
      },
    ],
  },
  {
    id: 'laptop-guitar-vowel-packets',
    name: 'Vowel packets',
    category: 'pad',
    description:
      'A slow vowel pad down a bad line: packets stick and burst, and the chord swirls as if behind glass.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 1.2, release: 4, spread: 0.7, volume: -13 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Stuck stream', params: { loss: 0.55, stutter: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'laptop-guitar-spectral-sunburn',
    name: 'Spectral sunburn',
    category: 'pad',
    description:
      'A bright shifting table swelling in, overdriven by a pentode so it flattens early, under a halo an octave up.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { attack: 3, release: 6, spread: 0.7, volume: -16 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.6, highCut: 12000, output: -3 },
      },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3, width: 0.7 } },
    ],
  },
  {
    id: 'laptop-guitar-hollow-click-bed',
    name: 'Hollow hum',
    category: 'drone',
    description:
      'A dark hollow tone with a strong sub, crushed to few bits and played through a combo amp with mains hum.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { sub: 0.5, cutoff: 900, attack: 2, volume: -10 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed', params: { rate: 9000, bits: 7, drive: 6 } },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -44 } },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { treble: -0.3, output: 5 } },
    ],
  },
  {
    id: 'laptop-guitar-sine-and-hiss',
    name: 'Sine and hiss',
    category: 'pad',
    description:
      'Near-pure sines with a soft sub, with air noise that swells into the gaps and a slow shift that makes them beat.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { cutoff: 1800, attack: 1, release: 3, volume: -16.5 },
    },
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Breathing recorder',
        params: { type: 6, level: -36, tone: 0.3 },
      },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 1.2, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-saw-wall',
    name: 'Saw wall',
    category: 'pad',
    description:
      'Full detuned saws through a dark fuzz and a dense grain cloud: a thick warm wall with the chord inside it.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.9,
        motion: 0.3,
        detune: 20,
        sub: 0.3,
        cutoff: 5000,
        attack: 0.8,
        release: 4,
        spread: 0.8,
        volume: -16,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Dark fuzz bed',
        params: { drive: 0.6, highCut: 3200, output: -9.5 },
      },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 260, density: 30, spray: 0.5, feedback: 0.4, mix: 0.6 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, width: 0.7 } },
    ],
  },

  // atmosphere: the sea and the mains, heard the way a laptop hears them
  {
    id: 'laptop-guitar-shore-down-line',
    name: 'Shore down the line',
    category: 'texture',
    description:
      'Slow waves reduced to the partials a starving stream keeps, so the sea becomes a low, swirling murmur.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.5, tone: 0.85, attack: 1.5, width: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Few partials', params: { loss: 0.7, stereo: 0.6 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-ground-loop',
    name: 'Ground loop',
    category: 'drone',
    description:
      'Mains hum tuned to the key, through a pentode and a slow flanger: the low buzz of a rig left on between songs.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.6, tone: 0.85, resonance: 0.35, attack: 0.6, width: 0.5, volume: -8 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.6, lowCut: 60, tone: 0.6, highCut: 9000, output: 2 },
      },
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { depth: 60, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // aurora: brass and string pads overexposed
  {
    id: 'laptop-guitar-overexposed-brass',
    name: 'Overexposed brass',
    category: 'pad',
    description:
      'A slow brass pad whose filter overshoot is caught by a grain cloud and clipped by a triode into a bright smear.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { brilliance: 3200, attack: 0.8, release: 4, detune: 12, volume: -14 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 180, density: 28, spray: 0.45, mix: 0.6 },
      },
      {
        deviceId: 'analog-drive',
        preset: 'Glowing triode',
        params: { drive: 0.65, tone: 0.5, output: -1 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-bleached-strings',
    name: 'Bleached strings',
    category: 'pad',
    description:
      'Wide synthetic strings with the low end cut, thinned to what a codec discards and set in a long plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 7000, lowCut: 400, attack: 1.6, release: 5, volume: -8 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Thin air', params: { loss: 0.5, smear: 0.5 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // bowed-string: held amp feedback and a bowed string for the patch to blur
  {
    id: 'laptop-guitar-held-feedback',
    name: 'Held feedback',
    category: 'string',
    description:
      'A string driven until it jumps the octave, through a triode and a stack: one line of singing amp feedback.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 1.4, release: 3, vibrato: 0.2, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Glowing triode',
        params: { drive: 0.7, push: 1, highCut: 8000, output: -10 },
      },
      { deviceId: 're-amp', preset: 'Warm stack', params: { room: 0.5, output: 1 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.22, width: 0.7 } },
    ],
    preview: 'line',
  },
  {
    id: 'laptop-guitar-bowed-held',
    name: 'Bowed and caught',
    category: 'string',
    description:
      'Slow flute-like bows that a sustain patch catches and holds as an even pad, under repeats pitched an octave up.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 1.8, release: 2.5, brightness: 0.9, pressure: 0.3, detune: 6, volume: -11 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { sensitivity: 0.7, decay: 8, mix: 0.6 },
      },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 500, mix: 0.25 } },
    ],
  },

  // chamber-strings: an orchestral record fed to the patch
  {
    id: 'laptop-guitar-strings-in-buffer',
    name: 'Strings in the buffer',
    category: 'string',
    description:
      'A warm section of six players dissolved until no bow change is left, darkened and swirled by a thin stream.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 1.2, release: 3, vibrato: 8, volume: -12.5 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.92, width: 0.2, mix: 0.8 },
      },
      {
        deviceId: 'low-bitrate',
        preset: 'Behind glass',
        params: { loss: 0.55, frame: 2, stereo: 0.25 },
      },
    ],
  },
  {
    id: 'laptop-guitar-bow-noise-grit',
    name: 'Bow hair and grit',
    category: 'string',
    description:
      'Mostly the air of the bows, through a worn nine-bit converter and a cloud of short grains: rosin as texture.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 3, attack: 0.8, scatter: 0.6, volume: -6.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn converter', params: { jitter: 0.5 } },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 70, density: 30, spray: 0.6, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },

  // choir: harmony vocals lifted from a single and worn by the buffer
  {
    id: 'laptop-guitar-stuck-harmony',
    name: 'Stuck harmony',
    category: 'voice',
    description:
      'High oohs caught by a sticking buffer, like the backing vocals of a beach single that will not play through.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { voice: 1.24, ensemble: 0.6, attack: 0.3, release: 1.5, volume: -8 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Jukebox single', params: { crackle: 0.25, pops: 0.1 } },
      {
        deviceId: 'glitch',
        preset: 'Stuck',
        params: { time: 230, chance: 0.6, calm: 0.5, decay: 0.3, spread: 0.4, mix: 0.85 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-breath-bitrate',
    name: 'Breath and bitrate',
    category: 'voice',
    description:
      'Almost all breath and little voice, smeared by frozen packets into a hiss that keeps the shape of the chord.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 1.8, release: 4, tone: 10000, volume: -15 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Frozen stream', params: { loss: 0.5, smear: 0.7 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3, decay: 5 } },
    ],
  },

  // chord-harp: a strummed toy from a holiday market, shattered or fuzzed
  {
    id: 'laptop-guitar-strum-plate-shards',
    name: 'Strum plate shards',
    category: 'plucked',
    description:
      'A strummed chord harp broken into forty-millisecond slices that repeat, skip and jump octaves across the field.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 55, sustain: 4, tone: 0.65, pad: 0.15, volume: -3 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Shards', params: { chance: 0.4, calm: 0.2, mix: 0.6 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-brushed-fuzz',
    name: 'Brushed chord fuzz',
    category: 'plucked',
    description:
      'A softly brushed chord over its own pad, pushed through a console into break-up and echoed by falling grains.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { strum: 12, pad: 0.5, sustain: 6, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Console edge',
        params: { drive: 0.65, push: 1, highCut: 9000, output: -8 },
      },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },

  // clarinet: a reed line for the patch to shift and starve
  {
    id: 'laptop-guitar-reed-in-loop',
    name: 'Reed from nothing',
    category: 'wind',
    description:
      'A clarinet that takes over a second to speak, each note left hanging in a blur and shifted so it slowly beats.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1.8, breath: 0.55, volume: -8 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 1.5, mix: 0.45 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, width: 0.4, mix: 0.55 },
      },
    ],
  },
  {
    id: 'laptop-guitar-subtone-packets',
    name: 'Subtone packets',
    category: 'wind',
    description:
      'A breathy subtone reed down a bad connection: the line drops out, sticks on a packet and carries on in a room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.3, attack: 0.25, release: 0.8, vibrato: 0.2, volume: -5 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Bad connection',
        params: { loss: 0.55, dropouts: 0.3, stutter: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // drone: the floor of a noise piece
  {
    id: 'laptop-guitar-fuzz-organ-floor',
    name: 'Fuzz organ floor',
    category: 'drone',
    description:
      'A just major chord of wandering partials through a pentode fuzz: the thick organ-like floor under a noise piece.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { wave: 0.3, sub: 0.35, cutoff: 3500, attack: 2, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.6, lowCut: 50, highCut: 8000, output: -1 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, width: 0.7 } },
    ],
  },
  {
    id: 'laptop-guitar-cluster-static',
    name: 'Cluster in the wires',
    category: 'drone',
    description:
      'A dark cluster of close partials that arrives over several seconds, with radio static riding on its level.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { wave: 0.3, cutoff: 1400, sub: 0.15, attack: 5, width: 0.45, volume: -15.5 },
    },
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Rides the sound',
        params: { type: 5, level: -38, response: 0.6, tone: -0.4 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { tilt: -1.5, lowCut: 40, width: 0.2, mix: 0.5 },
      },
    ],
  },

  // dusk: a pop chord from a chorus polysynth, clipped and dropped
  {
    id: 'laptop-guitar-pop-chord-clipped',
    name: 'Pop chord, clipped',
    category: 'pad',
    description:
      'A chorus-polysynth chord hard-clipped at the converter, with rare slips where the buffer loses its place.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { cutoff: 5000, attack: 0.05, release: 1.8, chorus: 3, volume: -12 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Lo-fi',
        params: { driveDb: 18, toneDb: -2, outputDb: -18.5 },
      },
      { deviceId: 'glitch', preset: 'Rare slips', params: { chance: 0.25, calm: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-sub-dropouts',
    name: 'Sub with dropouts',
    category: 'pad',
    description:
      'A low square wave over its sub octave, on a stream that loses packets and leaves soft-edged holes.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { sub: 0.4, cutoff: 2000, attack: 0.8, release: 4, volume: -10.2 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Bad connection',
        params: { loss: 0.4, dropouts: 0.5, stutter: 0.15 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // ember: noise bursts and a clean pad to overdrive
  {
    id: 'laptop-guitar-noise-burst',
    name: 'Filtered burst',
    category: 'texture',
    description:
      'Noise through a band-pass that sweeps up and falls back, scattered into grains: the burst that opens a piece.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: { resonance: 0.45, filterAttack: 2.5, filterDecay: 3, ampRelease: 2.5, volume: 3 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 90, density: 24, scatter: 0.1, mix: 0.5 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-airy-overdrive',
    name: 'Airy pad overdriven',
    category: 'pad',
    description:
      'An airy saw pad with an octave above, driven by a transformer and split into a sharp side and a flat side.',
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        cutoff: 6500,
        ampAttack: 1,
        ampRelease: 4,
        unisonSpread: 0.7,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.7, output: -7 } },
      { deviceId: 'freq-shifter', preset: 'Split sky', params: { fine: 2, width: 0.6, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // felt-piano: a piano beside the laptop, which keeps only part of it
  {
    id: 'laptop-guitar-piano-and-haze',
    name: 'Piano and haze',
    category: 'keys',
    description:
      'A close felt piano with a hanging haze made of its own spectrum, and faint grains an octave up behind it.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { reverbMix: 0.15, outputDb: -16.5 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.85, smear: 0.9, width: 0.6, mix: 0.45 },
      },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 450, mix: 0.18 } },
    ],
  },
  {
    id: 'laptop-guitar-piano-starved',
    name: 'Piano, starved',
    category: 'keys',
    description:
      'A soft upright with its action noise, heard as if behind glass, over a quiet backwards loop of the last phrase.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { grit: 0.4, reverbMix: 0.2, outputDb: -14.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.6 } },
      { deviceId: 'micro-looper', preset: 'Backwards bed', params: { length: 2.5, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // flute: breath for the fuzz, and pipes for the buffer to trip over
  {
    id: 'laptop-guitar-breath-fizz',
    name: 'Breath fizz',
    category: 'wind',
    description:
      'Low flutes that are nearly all air, swelled in and driven by a pentode until the breath itself fizzes.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { blow: 0.25, attack: 1.2, release: 3.5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.55, tone: 0.4, highCut: 12000, output: -6 },
      },
      { deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-pipes-backwards',
    name: 'Pipes, then backwards',
    category: 'wind',
    description:
      'Chiffy pan pipes with no vibrato, each note handed back in reverse and tripped by soft stumbles of the buffer.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.6, release: 0.8, volume: -8 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 480, feedback: 0.3, mix: 0.4 },
      },
      { deviceId: 'glitch', preset: 'Gentle stumble', params: { chance: 0.3, mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // fm-glass: the little bell tune on top, and a pad of aliases
  {
    id: 'laptop-guitar-vibes-bad-disc',
    name: 'Vibes, bad disc',
    category: 'bell',
    description:
      'A soft FM vibraphone melody on a disc that skips: notes cut short, repeated and dropped, in a small plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { brightness: 0.4, decay: 3, release: 2.5, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Skipping disc',
        params: { time: 160, chance: 0.45, repeat: 0.6, calm: 0.4, spread: 0.4, mix: 0.75 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-alias-pad',
    name: 'Alias pad',
    category: 'pad',
    description:
      'A crystalline FM pad sampled far too slowly, so folded images ring below it like metal, under a rising halo.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.45, attack: 1.2, release: 4, volume: -17.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Folded metal', params: { rate: 5200, mix: 0.7 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3, width: 0.7 } },
    ],
  },

  // handpan: struck steel turned to pixels and to a blur
  {
    id: 'laptop-guitar-steel-pixels',
    name: 'Steel pan pixels',
    category: 'bell',
    description:
      'A hand-played steel pan through an eight-bit toy converter, with grain repeats climbing an octave each pass.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { touch: 0.45, shimmer: 0.6, volume: -1 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Eight bit toy', params: { rate: 9000 } },
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 300, feedback: 0.5, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-low-ding-blur',
    name: 'Low ding, blurred',
    category: 'bell',
    description:
      'A low tongue drum struck softly, its ring thickened by a tape preamp and left hanging as a dark blur.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 8, touch: 0.2, cavity: 0.8, volume: -3 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Tape weight',
        params: { drive: 0.65, lowBump: 0.3, output: -13 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { blur: 0.85, tilt: -1.5, lowCut: 80, width: 0.2, mix: 0.55 },
      },
    ],
  },

  // harp: plucked strings for the chopper and the granulator
  {
    id: 'laptop-guitar-harp-cut-ups',
    name: 'Harp cut-ups',
    category: 'plucked',
    description:
      'A concert harp with hard half-second chops of itself an octave down, and a short reversed room after each note.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.25, touch: 0.55, halo: 0.3, volume: -2 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 420, mix: 0.45 } },
      { deviceId: 'shaped-reverb', preset: 'Backwards cloud', params: { time: 0.8, mix: 0.3 } },
    ],
  },
  {
    id: 'laptop-guitar-koto-granulator',
    name: 'Koto in the patch',
    category: 'plucked',
    description:
      'Silk koto strings saturated so the pluck flattens, each note scattered at once into fifty-millisecond grains.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { pluck: 0.14, touch: 0.35, decay: 2.2, bend: 0, volume: -4 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 16, outputDb: -8 } },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 50, density: 40, spray: 0.5, feedback: 0.45, spread: 1, mix: 0.55 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.2, decay: 3 } },
    ],
  },

  // horns: a brass swell to clip, and a trumpet on a small radio
  {
    id: 'laptop-guitar-horn-swell-clipped',
    name: 'Horn swell, clipped',
    category: 'wind',
    description:
      'A horn section that swells over a second into a tube stage, flattening as it gets loud, then blurs.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.7, attack: 1.5, release: 3, volume: -12 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube Preamp',
        params: { driveDb: 16, toneDb: 3, outputDb: -14 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.75, width: 0.6, mix: 0.5 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-transistor-trumpet',
    name: 'Trumpet on the beach',
    category: 'wind',
    description:
      'A muted trumpet from a small transistor radio with a little static, as heard along a beach, and a spring tank.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { blow: 0.55, attack: 0.12, release: 1.2, vibrato: 0.25, volume: -8 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Clean transistor',
        params: { static: 0.08, fading: 0.2, bandwidth: 0.6, speaker: 0.7 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // ladder-bass: weight under the wall, and a line with bits missing
  {
    id: 'laptop-guitar-sub-under-wall',
    name: 'Sub under the wall',
    category: 'keys',
    description:
      'A plain sub tone given a transformer drive so small speakers can hear it: the floor under a wall of fuzz.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 180, drive: 0.15, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6, output: -6 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
    preview: 'low',
  },
  {
    id: 'laptop-guitar-bitten-bass',
    name: 'Bitten bass line',
    category: 'keys',
    description:
      'A plucked ladder-filter bass sampled at six kilohertz and ten bits, with a single slapback from a dark delay.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { cutoff: 400, decay: 1.4, volume: 3 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 6000, bits: 10 } },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 140, mix: 0.25 } },
    ],
    preview: 'line',
  },

  // mallets: the small tune on top of the noise
  {
    id: 'laptop-guitar-vibes-loop-back',
    name: 'Vibes, looped back',
    category: 'bell',
    description:
      'A vibraphone with its motor on, over a loop of the last three seconds played backwards, in a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.35, decay: 1.5, motor: 0.5, motorRate: 3.5, volume: -6 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Backwards bed', params: { fade: 0.5, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'laptop-guitar-glockenspiel-rain',
    name: 'Glockenspiel rain',
    category: 'bell',
    description:
      'Hard glockenspiel notes that come back as sparse grains an octave up, feeding round so they climb and thin.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.7, decay: 1.4, width: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { density: 10, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // modal-bells: a music box that buffers, a bowl that distorts
  {
    id: 'laptop-guitar-music-box-buffering',
    name: 'Music box, buffering',
    category: 'bell',
    description:
      'A music box down a stuck stream: notes swirl behind glass and whole packets repeat in bursts, in a small room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 4, hardness: 0.7, release: 0.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Stuck stream', params: { loss: 0.45, burst: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-bowl-fuzz',
    name: 'Rubbed bowl fuzz',
    category: 'bell',
    description:
      'Singing bowls rubbed until they hold, through a triode that turns their beating into grit, and a slow phaser.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 10, detune: 1.4, brightness: 0.6, release: 0.4, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Glowing triode',
        params: { drive: 0.7, push: 1, output: -4 },
      },
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },

  // organ: reeds as thick as a fuzzed guitar
  {
    id: 'laptop-guitar-harmonium-red',
    name: 'Harmonium in the red',
    category: 'organ',
    description:
      'A harmonium chord pushed hard into a pentode so the reeds fuse into one buzzing mass, doubled to each side in a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { reed: 0.5, attack: 0.3, release: 1.5, tone: 4200, volume: -14 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.7, push: 1, lowCut: 70, highCut: 8000, output: -6.5 },
      },
      { deviceId: 'stereo-detune', preset: 'Thick double', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-chapel-frozen',
    name: 'Chapel stream frozen',
    category: 'organ',
    description:
      'Soft chapel flutes on a stream that freezes: frames of the chord smear into each other in a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.5, release: 2, volume: -13.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Frozen stream', params: { loss: 0.65, smear: 0.8 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },

  // outdoors: what the microphone caught on the holiday, through the laptop
  {
    id: 'laptop-guitar-crickets-compressed',
    name: 'Crickets, compressed',
    category: 'texture',
    description:
      'Night crickets with their phases scattered by a thin stream until they shimmer like a detuned synth.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: {
        density: 0.75,
        distance: 0.3,
        movement: 0.4,
        tone: 0.5,
        attack: 1,
        release: 4,
        width: 0.7,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Smeared phases', params: { loss: 0.7, stereo: 0.5 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'laptop-guitar-chimes-skipping',
    name: 'Chimes, skipping',
    category: 'texture',
    description:
      'Wind chimes on a porch, with half-second slices that repeat, reverse and jump an octave like ghosts of the breeze.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { density: 0.6, movement: 0.6, width: 0.7, volume: -6 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Octave ghosts', params: { chance: 0.45, mix: 0.7 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.22 } },
    ],
  },

  // string-machine: an ensemble keyboard under the guitars
  {
    id: 'laptop-guitar-ensemble-haze',
    name: 'Ensemble haze',
    category: 'string',
    description:
      'The top octave of a string ensemble, softly saturated and ground into a dense, restless cloud of short grains.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.9, low: 0.15, tone: 8000, volume: -15 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 12, outputDb: -8 } },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 110, density: 36, spray: 0.6, texture: 0.4, mix: 0.65 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'laptop-guitar-saws-filter-bursts',
    name: 'Saw filter bursts',
    category: 'string',
    description:
      'Dry sawtooth strings through a resonant band-pass that jumps to a new place eight times a second, in a plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.05, release: 1, ensemble: 0.3, width: 0.5, volume: 1 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Stepped', params: { resonance: 4, mix: 0.85 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // tanpura: a buzzing string is already half a fuzz pedal
  {
    id: 'laptop-guitar-buzz-through-fuzz',
    name: 'Buzz through fuzz',
    category: 'drone',
    description:
      'Four strings buzzing on an open bridge into a pentode, so the overtone sweep of each pluck tears, then blurs.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.85, speed: 4, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.6, lowCut: 60, highCut: 9000, output: -1 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.7, width: 0.6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'laptop-guitar-monochord-memory',
    name: 'Monochord memory',
    category: 'drone',
    description:
      'Plain strings with no buzz plucked round slowly, while flickers of the last twelve seconds drift back over them.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 6, decay: 20, volume: -3.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { memory: 0.9, mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // tape-orchestra: a symphony off a record, fed to the patch
  {
    id: 'laptop-guitar-symphony-in-patch',
    name: 'Symphony in the patch',
    category: 'string',
    description:
      'Orchestral strings off worn tape, smeared by second-long grains that half run backwards, warmed by a preamp.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { age: 0.45, attack: 0.6, release: 2.5, volume: -8 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Slow smear',
        params: { size: 1000, density: 8, feedback: 0.45, mix: 0.7 },
      },
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.5, output: -6.5 } },
    ],
  },
  {
    id: 'laptop-guitar-horn-chorale-grains',
    name: 'Chorale in grains',
    category: 'wind',
    description:
      'A horn chorale on tape with a grainy copy one and two octaves above it, swelling in a slow shaped room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.3, release: 1.5, age: 0.4, volume: -12.5 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Grain shimmer',
        params: { pitchB: 24, levelB: 0.3, size: 70, mix: 0.35 },
      },
      { deviceId: 'shaped-reverb', preset: 'Slow bloom', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // thesis: chords made of filtered noise, which is where the patch ends up anyway
  {
    id: 'laptop-guitar-noise-chord',
    name: 'Noise chord',
    category: 'pad',
    description:
      'Chords of narrow resonant noise bands, levelled and pushed through a triode: pitched hiss with a hall behind.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 60, attack: 1, release: 3.5 },
    },
    effects: [
      { deviceId: 'limiter-1176', preset: 'Drive', params: { inputGain: 14, outputGain: -8 } },
      { deviceId: 'analog-drive', preset: 'Glowing triode', params: { drive: 0.5, output: -2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'laptop-guitar-strummed-noise',
    name: 'Strummed noise',
    category: 'plucked',
    description:
      'Noise bands strummed like a chord with a quick attack, caught by the buffer and bounced in shrinking repeats.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { resonance: 55, strum: 60, release: 1.6 },
    },
    effects: [
      { deviceId: 'limiter-1176', preset: 'Drive', params: { inputGain: 14, outputGain: -5.5 } },
      { deviceId: 'glitch', preset: 'Bouncing', params: { chance: 0.45, mix: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // tine-piano: an electric piano from the same single, overdriven or blurred
  {
    id: 'laptop-guitar-tines-in-red',
    name: 'Tines in the red',
    category: 'keys',
    description:
      'A barking stage piano played hard into a console past its limit, with a dark slapback: a clipped pop chord.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { decay: 1.3, release: 0.4, drive: 0.6, volume: -10 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Console edge',
        params: { drive: 0.7, push: 1, output: -8 },
      },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 120, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'laptop-guitar-bell-tines-blurred',
    name: 'Bell tines, blurred',
    category: 'keys',
    description:
      'Bell-like tines with a halo made of their own upper spectrum, and a reverb that blooms an octave up.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { decay: 1.8, release: 0.8, tremolo: 0, volume: -15 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { blur: 0.75, width: 0.6 } },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.3 } },
    ],
  },

  // west-coast: wavefolding, the analogue cousin of the same idea
  {
    id: 'laptop-guitar-folded-pluck',
    name: 'Folded pluck restruck',
    category: 'plucked',
    description:
      'A bright folded pluck clipped by a sixteen-kilohertz converter, then restruck by little loops of itself in a plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { fold: 0.65, decay: 3, chance: 0.3, volume: -2.2 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { jitter: 0.25, drive: 14 } },
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 360, repeats: 5, mix: 0.45 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'laptop-guitar-folding-drone-fizz',
    name: 'Folding drone fizz',
    category: 'drone',
    description:
      'A slowly folding low tone folded again by a second wavefolder until it fizzes, ringing against a shifted copy.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.6, attack: 1.5, drift: 0.6, volume: -12 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Wavefold Lead',
        params: { driveDb: 10, toneDb: 2, outputDb: -6.5 },
      },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: 2, width: 0.7, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, width: 0.7 } },
    ],
  },

  // zither: more strings for the fuzz and the converter
  {
    id: 'laptop-guitar-zither-haze',
    name: 'Zither haze',
    category: 'plucked',
    description:
      'Doubled zither courses strummed in octaves through a triode and blurred: a jangling chord melted to a bright haze.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { strum: 60, brightness: 0.7, volume: -12 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Glowing triode',
        params: { drive: 0.65, tone: 0.3, output: -4 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, tilt: 0.5, width: 0.6, mix: 0.6 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'laptop-guitar-hammered-pixels',
    name: 'Hammered pixels',
    category: 'plucked',
    description:
      'A hammered dulcimer roll through an eight-bit companded line, pattering round a cave of short echoes.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 7, brightness: 0.7, volume: -13.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Telephone exchange', params: { rate: 10000 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } },
    ],
  },
]
