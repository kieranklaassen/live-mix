import { type FactoryPreset } from '../types'

// A guitar played with a bow through a hot amplifier and a huge room, a high voice, a pump organ,
// small steel bars, an upright, a village band and four bows: everything arrives slowly and ends large.

export const PRESETS: readonly FactoryPreset[] = [
  // Bow: the electric guitar under a cello bow
  {
    id: 'far-north-bow-on-steel',
    name: 'Bow on steel',
    category: 'string',
    description:
      'A cello bow drawn slowly over electric guitar strings, through a hot pentode and a stack with the top left open, into a hall seconds across.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 1.6,
        release: 3,
        brightness: 0.8,
        pressure: 0.85,
        body: 0.2,
        vibrato: 0.05,
        detune: 7,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.6, tone: 0.3, highCut: 11000, output: -6 },
      },
      { deviceId: 're-amp', preset: 'Warm stack', params: { treble: 0.2 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.45, decay: 14, highCut: 9000 },
      },
    ],
  },
  {
    id: 'far-north-rosin-lead',
    name: 'Rosin lead',
    category: 'string',
    description:
      'One bowed guitar string with a slow hand vibrato, warmed by a triode, its reverb climbing an octave behind it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.35,
        release: 2.5,
        brightness: 0.7,
        pressure: 0.5,
        body: 0.25,
        vibrato: 0.3,
        vibratoRate: 4,
        detune: 4,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.55, output: -3.5 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35, decay: 10 } },
    ],
    preview: 'line',
  },
  {
    id: 'far-north-lava-field-drone',
    name: 'Lava field drone',
    category: 'drone',
    description:
      'Two low strings bowed hard into a fuzz with an octave under them, slow to arrive and heavy, in a cathedral.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 3,
        release: 6,
        brightness: 0.3,
        pressure: 0.9,
        body: 0.3,
        vibrato: 0,
        detune: 12,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Fuzz pedal',
        params: { driveDb: 22, toneDb: -2, outputDb: -24 },
      },
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'far-north-magnet-and-string',
    name: 'Magnet and string',
    category: 'string',
    description:
      'Strings held singing by a magnetic sustainer, never picked, doubled by slow backwards swells of themselves in a long nave.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 1,
        attack: 2,
        release: 5,
        brightness: 0.55,
        decay: 12,
        vibrato: 0.1,
        detune: 8,
        volume: -16.5,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { spread: 0.2, mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-bow-barely-touching',
    name: 'Bow barely touching',
    category: 'string',
    description:
      'A bow barely touching the strings, soft as a flute, with grains an octave up scattered into a twelve-second room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 2.5, brightness: 0.9, pressure: 0.12, volume: -16.5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { feedback: 0.5, mix: 0.25 } },
      { deviceId: 'fdn-reverb', params: { mix: 0.45, decay: 12, size: 1.5, breathDepth: 0 } },
    ],
  },
  {
    id: 'far-north-amp-begins-to-sing',
    name: 'Amp begins to sing',
    category: 'string',
    description:
      'A held string that tips into its octave as the amplifier feeds back, through a speaker near its limit, a spring and a blooming hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 3, release: 6, pressure: 0.95, vibrato: 0.2, volume: -10 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -1 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },

  // Guitar: the same guitar with the bow put down
  {
    id: 'far-north-whiteout-swell',
    name: 'Whiteout swell',
    category: 'plucked',
    description:
      'A chord faded in over two seconds so no pick is heard, pushed through a pentode into a reverb that climbs while it rings.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 2.2, sustain: 24, tone: 3400, warmth: 0.6, volume: 6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.45 } },
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { mix: 0.4, shimmer: 0.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-cold-clear-picking',
    name: 'Cold clear picking',
    category: 'plucked',
    description:
      'Clean neck-pickup notes picked softly through a tremolo that shimmers rather than pulses, with dark repeats behind on a long plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.9, hardness: 0.4, sustain: 12, tone: 3000, warmth: 0.5, volume: 2.5 },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 2, rate: 3.2, depth: 0.6, phase: 90, drift: 0.2 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 450, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-each-note-backwards',
    name: 'Each note backwards',
    category: 'plucked',
    description:
      'Hard bridge-pickup notes heard mostly backwards, each rising to its own pick and cut off, with a hall after the reversal.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 0.25, hardness: 0.7, sustain: 12, strum: 0, warmth: 0.5, volume: -5.3 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Long mirror',
        params: { time: 2000, feedback: 0.3, smooth: 0.6, spread: 0.5, mix: 0.8 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'far-north-black-sand-baritone',
    name: 'Black sand baritone',
    category: 'plucked',
    description:
      'Low strings hit hard at the bridge into a driven valve and a speaker on its edge, in a dark stone well.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { sustain: 16, strum: 12, volume: -8 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube preamp',
        params: { driveDb: 20, toneDb: -6, outputDb: -10 },
      },
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { treble: -0.3, output: -6.5 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'far-north-frost-on-the-wires',
    name: 'Frost on the wires',
    category: 'plucked',
    description:
      'A twelve-string strummed with its octaves doubled above it, in a short bright reverb with a halo two octaves up.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { sustain: 22, strum: 45, volume: -3.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'shimmer', preset: 'Glass', params: { decay: 9, mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-strum-that-stays',
    name: 'Strum that stays',
    category: 'plucked',
    description:
      'An open chord strummed slowly and caught as a pad that hangs under it, glued by a console stage, in a cathedral.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { strum: 70, volume: -4 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.6 } },
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.35, output: -4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // Organ: the pump organ in the corner
  {
    id: 'far-north-pedals-and-bellows',
    name: 'Pedals and bellows',
    category: 'organ',
    description:
      'A pump organ with the bellows worked unevenly by foot, reedy and close, with the air of an empty room around it.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { reed: 0.8, bellows: 1, attack: 0.35, release: 0.8, tone: 2000, volume: -13.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'far-north-reeds-through-valves',
    name: 'Reeds through valves',
    category: 'organ',
    description:
      'A harmonium chord pushed into a glowing triode until the reeds growl, then left in a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { reed: 0.6, celeste: 0.4, attack: 0.5, release: 1.5, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.65, output: -6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'far-north-low-reeds-beating',
    name: 'Low reeds beating',
    category: 'drone',
    description:
      'Two low reed ranks tuned apart so they beat, the beating itself drifting slowly, entering over seconds into a room that breathes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: {
        sub: 0.4,
        octave: 0.5,
        reed: 0.3,
        attack: 3,
        release: 7,
        tone: 2200,
        volume: -10.6,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.35 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 14, breathRate: 0.12, mix: 0.45 },
      },
    ],
  },
  {
    id: 'far-north-far-rotor-flutes',
    name: 'Far rotor flutes',
    category: 'organ',
    description:
      'Soft flute pipes with a shallow tremulant, through a slowly rotating speaker heard from across the room and a long plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { sub: 0.3, tremulant: 0.4, breath: 0.5, attack: 0.3, release: 1.2, volume: -12 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-pipes-in-reverse',
    name: 'Pipes in reverse',
    category: 'organ',
    description:
      'Pipes that take two seconds to speak, turned backwards in slow overlapping swells and left in a space seconds across.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 2, tone: 1800, volume: -11 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'far-north-every-rank-drawn',
    name: 'Every rank drawn',
    category: 'organ',
    description:
      'The full organ swelled in over a second, thickened by a transformer and spread wide down a long stone nave.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { attack: 1.2, release: 3, tone: 5000, volume: -17.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { lowDecay: 8, mix: 0.5 } },
    ],
  },

  // Choir: the falsetto
  {
    id: 'far-north-falsetto-over-snow',
    name: 'Falsetto over snow',
    category: 'voice',
    description:
      'One high male voice on a closed vowel with a narrow vibrato, on a long plate with a faint octave rising above it.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.85,
        voice: 1.32,
        breath: 0.25,
        vibrato: 18,
        vibratoRate: 5,
        attack: 0.25,
        release: 1.2,
        tone: 8000,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'far-north-sung-into-pickup',
    name: 'Sung into the pickup',
    category: 'voice',
    description:
      'A voice sung into a guitar pickup: small, nasal and driven through a little speaker, then let out into a huge space.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vowel: 0.3, voice: 1.28, vibrato: 12, attack: 0.15, release: 0.9, volume: -8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { drive: 0.5 } },
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.4, output: -10 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    preview: 'line',
  },
  {
    id: 'far-north-words-turned-round',
    name: 'Words turned round',
    category: 'voice',
    description:
      'High voices whose drifting vowels come back reversed and overlapping, so nothing starts where it should, in a soft hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { vowel: 0.6, motion: 0.8, attack: 0.4, volume: -10 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 900, smooth: 0.6, mix: 0.7 },
      },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
  },
  {
    id: 'far-north-voice-over-itself',
    name: 'Voice over itself',
    category: 'voice',
    description:
      'One high singer to a note on oo, laid over itself on a loop of tape between two decks, spread wide and a little detuned, in a cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: {
        vowel: 0.9,
        voice: 1.3,
        ensemble: 0,
        vibrato: 4,
        attack: 1.5,
        release: 5,
        width: 0.7,
        volume: -18,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3.2, feedback: 0.68, mix: 0.4 },
      },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { width: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'far-north-trebles-in-the-loft',
    name: 'Trebles in the loft',
    category: 'voice',
    description:
      'A section of children singing an open ah without vibrato from the organ loft, the nave doing the rest.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        vowel: 0.1,
        voice: 1.36,
        breath: 0.3,
        ensemble: 0.9,
        vibrato: 0,
        attack: 1.2,
        release: 3,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } }],
  },
  {
    id: 'far-north-old-men-humming',
    name: 'Old men humming',
    category: 'voice',
    description:
      'Low men humming a closed oo together, like a chanted verse coming out of a kitchen radio, in a hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { vowel: 0.95, voice: 0.85, vibrato: 3, attack: 2, tone: 2400, volume: -4 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.1, bandwidth: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },

  // Bells: the glockenspiel and the small things on the table beside it
  {
    id: 'far-north-frosted-glockenspiel',
    name: 'Frosted glockenspiel',
    category: 'bell',
    description:
      'Small steel bars struck with a hard beater and left to ring, bright and exact, with a thin halo two octaves up and a short plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        decay: 3.5,
        damping: 0.25,
        hardness: 0.9,
        detune: 0.2,
        brightness: 1,
        release: 0.1,
        volume: -4.3,
      },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { decay: 0.6, mix: 0.25 } },
    ],
  },
  {
    id: 'far-north-spring-running-down',
    name: 'Spring running down',
    category: 'bell',
    description:
      'A music box comb with a copy of itself an octave down and twice as slow, as if the clockwork were running out.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 2.2, hardness: 0.8, detune: 0.8, brightness: 0.55, volume: -2.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-wet-finger-glasses',
    name: 'Wet finger glasses',
    category: 'bell',
    description:
      'Wine glasses rubbed at the rim until they sing, held as a chord that beats gently, in a hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { decay: 12, hardness: 0.1, detune: 1.2, sustain: 1, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-thumb-keys-answering',
    name: 'Thumb keys answering',
    category: 'bell',
    description:
      'A thumb piano whose notes are struck again by fading copies of themselves, then repeated by three tape heads.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 3, damping: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { mix: 0.3 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'far-north-bell-over-the-water',
    name: 'Bell over the water',
    category: 'bell',
    description:
      'A church bell heard from across a fjord: the strike softened by distance, the hum left hanging over far echoes.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 20, damping: 0.55, hardness: 0.6, brightness: 0.4, volume: -2.6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.85, room: 0.6 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { width: 0.6, mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'far-north-slate-bars',
    name: 'Slate bars',
    category: 'bell',
    description:
      'Short, dull bars like flat stones laid out in a row and struck with soft beaters, in a small bare room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        decay: 1.2,
        damping: 0.8,
        hardness: 0.35,
        position: 0.5,
        detune: 0.2,
        stretch: 1.08,
        brightness: 0.3,
        release: 0.3,
        volume: 5.5,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } }],
  },

  // Piano: the upright
  {
    id: 'far-north-piano-strings-rising',
    name: 'Piano, strings rising',
    category: 'keys',
    description:
      'A plain upright figure with a string section that swells up behind whatever is played, on a long plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.4, hardness: 0.45, reverbMix: 0, polyphony: 16, outputDb: -11.3 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 1.8, sensitivity: 0.65, mix: 0.55 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-hard-hammer-upright',
    name: 'Hard hammer upright',
    category: 'keys',
    description:
      'The upright with its felt lifted and the hammers hard, printed to a clean reel and left in a six-second hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.9, reverbMix: 0, width: 0.7, polyphony: 16, outputDb: -9.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.4 } },
    ],
  },
  {
    id: 'far-north-felt-and-long-memory',
    name: 'Felt and long memory',
    category: 'keys',
    description:
      'A soft close piano whose earlier notes drift back dull, slowed or backwards under the new ones, in a dark space.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0, resonance: 0.3, polyphony: 12, outputDb: -11 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.35 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 3500, mix: 0.35 },
      },
    ],
  },
  {
    id: 'far-north-piano-reversed-room',
    name: 'Piano, reversed room',
    category: 'keys',
    description:
      'A hard-struck piano with its strings left open, each note followed by a four-second swell rising backwards to a cut, in a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.3,
        hardness: 0.6,
        reverbMix: 0,
        resonance: 0.6,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-piano-into-mist',
    name: 'Piano into mist',
    category: 'keys',
    description:
      'Soft chords whose spectrum hangs and smears long after the hammers, with an octave of itself held over the blur.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.9,
        hardness: 0.2,
        thump: 0.2,
        action: 0.1,
        reverbMix: 0,
        resonance: 0,
        polyphony: 12,
        outputDb: -20,
      },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.98, tilt: -1, shimmer: 0.5, width: 0.15, mix: 0.75 },
      },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { width: 0.5, mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-untuned-upright',
    name: 'Untuned upright',
    category: 'keys',
    description:
      'An upright nobody has tuned for years, a little sour and clattery, recorded in a small room on a worn cassette.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.2,
        hardness: 0.55,
        detune: 1,
        action: 0.7,
        grit: 0.3,
        reverbMix: 0,
        polyphony: 16,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3, output: -3 } },
    ],
  },

  // Horns: the brass band
  {
    id: 'far-north-village-band',
    name: 'Village band',
    category: 'wind',
    description:
      'Four trumpets to a note blown at full breath like a small brass band, held together by a slow compressor in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.72, attack: 0.25, release: 1.5, vibrato: 0.1, volume: -8 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-horns-from-nothing',
    name: 'Horns from nothing',
    category: 'wind',
    description:
      'French horns that take seconds to arrive and brighten as they grow, in a space that rings on long after them.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.7, section: 0.8, attack: 4, release: 6, volume: -8 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 16, mix: 0.45 } }],
    preview: 'chord',
  },
  {
    id: 'far-north-tubas-in-the-fog',
    name: 'Tubas in the fog',
    category: 'wind',
    description:
      'Tubas and trombones entering slowly from nothing, weighted by a transformer, in a twelve-second room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.5, attack: 3, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'fdn-reverb', params: { decay: 12, size: 1.6, breathDepth: 0, mix: 0.4 } },
    ],
    preview: 'low',
  },
  {
    id: 'far-north-one-flugelhorn',
    name: 'One flugelhorn',
    category: 'wind',
    description:
      'A single flugelhorn played softly with the breath audible and a little vibrato, alone on a long plate.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { breath: 0.6, attack: 0.35, release: 1.8, vibrato: 0.25, volume: -3 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'far-north-muted-trumpet-returning',
    name: 'Muted trumpet returning',
    category: 'wind',
    description:
      'A muted trumpet line whose phrases come back reversed a moment later, like an answer from the far wall of a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.12, release: 1.2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 1200, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'far-north-band-across-the-valley',
    name: 'Band across the valley',
    category: 'wind',
    description:
      'Trumpets in open fifths heard from across a valley: the edge gone, the air wide, far echoes behind them.',
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fifths',
      params: { blow: 0.55, breath: 0.3, section: 0.8, attack: 0.3, release: 1.5, volume: 0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.7, room: 0.6 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { width: 0.6, mix: 0.35 } },
    ],
  },

  // Strings: the quartet
  {
    id: 'far-north-four-bows-close',
    name: 'Four bows close',
    category: 'string',
    description:
      'A quartet with one player to a note, close enough to hear rosin and bow changes, on a small plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: {
        attack: 0.25,
        release: 0.8,
        bow: 0.6,
        air: 0.4,
        vibrato: 9,
        scatter: 0.5,
        width: 1,
        volume: -8,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } }],
  },
  {
    id: 'far-north-mutes-on',
    name: 'Mutes on',
    category: 'string',
    description:
      'Muted strings that swell in over three seconds without vibrato, in a hall whose tail sings back like a far choir.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 4, attack: 3.5, release: 4, volume: -6.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
  },
  {
    id: 'far-north-over-the-fingerboard',
    name: 'Over the fingerboard',
    category: 'string',
    description:
      'Airy bows over the fingerboard, more breath than string, with a bed of small octave echoes sparkling above them.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 1.5, release: 2.5, air: 0.9, volume: -6.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { interval: 0, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, mix: 0.4 } },
    ],
  },
  {
    id: 'far-north-backwards-quartet',
    name: 'Backwards quartet',
    category: 'string',
    description:
      'A quartet played backwards: every bow stroke swells up to where it began and stops, on a long plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { players: 2, attack: 0.15, release: 0.6, volume: -8 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1500, feedback: 0.1, smooth: 0.8, mix: 0.9 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-strings-at-the-top',
    name: 'Strings at the top',
    category: 'string',
    description:
      'Six players a note bowing towards the bridge with a wide vibrato, glued by a preamp, filling a cathedral.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 1.8, release: 3.5, bow: 0.7, vibrato: 16, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.45, output: -4.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'far-north-quartet-going-flat',
    name: 'Quartet going flat',
    category: 'string',
    description:
      'Slow bows drifting out of tune with each other, the whole take sagging on a reel of tape that will not hold its speed.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { players: 3, vibrato: 0, scatter: 1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.8, hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Acoustic guitar: the songs as they are played in a kitchen
  {
    id: 'far-north-kitchen-table-acoustic',
    name: 'Kitchen table acoustic',
    category: 'plucked',
    description:
      'A steel-string fingerpicked softly with the flesh of the thumb, on quarter-inch tape with a little of the room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { body: 0.85, nail: 0.3, sustain: 9, release: 2.5, tone: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'far-north-boathouse-banjo',
    name: 'Boathouse banjo',
    category: 'plucked',
    description:
      'Thin strings picked hard with the nail right at the bridge so they clack like a banjo, printed hot to tape, a short spring behind.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: {
        body: 0.4,
        position: 0.08,
        nail: 0.9,
        sustain: 2.5,
        release: 1,
        tone: 0.75,
        strum: 8,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { drive: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 1.2, mix: 0.2 } },
    ],
  },

  // Atmosphere: what the microphones pick up between songs
  {
    id: 'far-north-wind-in-slow-waves',
    name: 'Wind in slow waves',
    category: 'texture',
    description:
      'Wind across open ground with a faint whistle in it, let into a room in slow waves so it seems to come and go.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.55,
        movement: 0.8,
        tone: 0.45,
        resonance: 0.5,
        attack: 3,
        release: 6,
        width: 0.6,
        volume: 0.8,
      },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 8, breathRate: 0.15, breathDepth: 0.9, mix: 0.6 },
      },
    ],
  },
  {
    id: 'far-north-stack-left-on',
    name: 'Stack left on',
    category: 'texture',
    description:
      'A valve stack left on in an empty room: mains hum tuned to the key you hold, speaker hiss and the small dark space around it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.5, tone: 0.4, attack: 1.5, release: 3, volume: -9 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { noise: 0.3, output: -4 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },

  // Aurora: the brass and strings a synthesiser stands in for
  {
    id: 'far-north-sky-curtains',
    name: 'Sky curtains',
    category: 'pad',
    description:
      'A brass-and-string pad that starts dull and keeps swelling for as long as it is held, with an octave rising out of its reverb.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 900, attack: 3.5, release: 9, detune: 12, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 12, shimmer: 0.7, mix: 0.4 },
      },
    ],
  },
  {
    id: 'far-north-brass-in-green-light',
    name: 'Brass in green light',
    category: 'pad',
    description:
      'Synthesiser brass whose filter overshoots as each chord speaks, pushed a little by a preamp, in a cathedral.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { brilliance: 1400, contour: 0.75, attack: 0.8, release: 4, volume: -11 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -4.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // Chord harp: a strum plate from the toy shelf
  {
    id: 'far-north-sweep-with-reversals',
    name: 'Sweep with reversals',
    category: 'plucked',
    description:
      'A held chord swept slowly up and down four octaves of soft strings, answered by reversed copies an octave higher.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 150, tone: 0.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-held-chord-sparkle',
    name: 'Held chord, sparkle',
    category: 'pad',
    description:
      'More pad than pluck: the chord held as a soft organ tone with a random sparkle of strings on each press, in a cathedral.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 30, pad: 0.9, sustain: 3, volume: -16.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // Clarinet: the woodwind player doubling
  {
    id: 'far-north-reed-and-ringing-wires',
    name: 'Reed and ringing wires',
    category: 'wind',
    description:
      'A clarinet entering from silence, with a bank of tuned strings that pick up each note and ring on behind it, in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.45, breath: 0.55, attack: 1.2, release: 2.5, volume: -6 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'far-north-bass-clarinet-growl',
    name: 'Bass clarinet growl',
    category: 'wind',
    description:
      'A bass clarinet blown hard and held low with a growl in the reed, through a warm valve stage, in a cathedral.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.78, attack: 0.5, release: 1.5, growl: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9, outputDb: -3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Drone: the note the whole song stands on
  {
    id: 'far-north-sun-at-midnight',
    name: 'Sun at midnight',
    category: 'drone',
    description:
      'A just major chord of slowly wandering partials with air around it, never quite still, with an octave climbing in its reverb.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: {
        partials: 1,
        wave: 0.45,
        air: 0.4,
        cutoff: 7000,
        attack: 3.5,
        width: 0.6,
        volume: -7.3,
      },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { interval: 0, mix: 0.3 } }],
    preview: 'hold',
  },
  {
    id: 'far-north-ground-under-the-ice',
    name: 'Ground under the ice',
    category: 'drone',
    description:
      'Low octaves over a heavy sub, growling through a dark fuzz and moving as slowly as weather, in a small dark room.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { sub: 0.6, cutoff: 700, attack: 4, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -9.2, mix: 0.85 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },

  // Dusk: the chorus polysynth under the band
  {
    id: 'far-north-long-blue-hour',
    name: 'Long blue hour',
    category: 'pad',
    description:
      'The chorus polysynth with both chorus lines on, soft and slow to speak, as a bed under everything in a space seconds across.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { cutoff: 1800, attack: 1.8, release: 5, chorus: 3, volume: -12 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.4 } }],
  },
  {
    id: 'far-north-plastic-organ-rotor',
    name: 'Plastic organ, rotor',
    category: 'organ',
    description:
      'A square-wave organ tone over its sub octave through a slowly turning speaker: the cheap keyboard standing in for pipes.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { cutoff: 2600, attack: 0.4, release: 2.5, chorus: 0, volume: -18 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Ember: steam and a pad from nothing
  {
    id: 'far-north-steam-vent',
    name: 'Steam vent',
    category: 'texture',
    description:
      'Filtered noise that rises like steam finding its way out of the ground and settles to a hiss, a slow comb moving in it, in a hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        cutoff: 300,
        resonance: 0.3,
        filterEnvAmount: 0.7,
        filterAttack: 3,
        filterDecay: 4,
        filterSustain: 0.65,
        ampAttack: 1.5,
        ampRelease: 4,
        velToAmp: 0,
        volume: 4.6,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'far-north-cloud-coming-in',
    name: 'Cloud coming in',
    category: 'pad',
    description:
      'Two saws an octave apart with air in them, slow to arrive, in a reverb whose tail is read again an octave up.',
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        cutoff: 4000,
        ampAttack: 3.5,
        ampRelease: 7,
        lfo2Amount: 0.1,
        unisonSpread: 0.5,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Octave halo',
        params: { bloom: 1, decay: 5, width: 0.4, mix: 0.45 },
      },
    ],
  },

  // Flute: the whistle and the breath
  {
    id: 'far-north-whistle-on-the-hill',
    name: 'Whistle on the hill',
    category: 'wind',
    description:
      'A low wooden whistle played plainly with a chiff on each note and hardly any vibrato, one quiet echo, in a hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.35, blow: 0.55, chiff: 0.7, vibrato: 0.15, scoop: 30, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 320, feedback: 0.15, mix: 0.2 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'far-north-breath-chord',
    name: 'Breath chord',
    category: 'wind',
    description:
      'Low flutes blown so softly they are mostly air, held as a chord, in a hall that shapes the tail into slow vowels.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 2, release: 4, volume: -16.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { mix: 0.35 } }],
    preview: 'chord',
  },

  // Glass: the toy piano and a pane of ice
  {
    id: 'far-north-toy-piano',
    name: 'Toy piano',
    category: 'bell',
    description:
      'A toy piano: short metal rods with a clack, a little out of true, through a small speaker in a small plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        ratio: 7,
        brightness: 0.55,
        decay: 0.9,
        release: 0.4,
        detune: 7,
        velocity: 0.8,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { drive: 0.15, noise: 0.05 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
    preview: 'keys',
  },
  {
    id: 'far-north-ice-forming',
    name: 'Ice forming',
    category: 'pad',
    description:
      'A glass tone that takes three seconds to form, its detuned pairs beating slowly, hanging in a very large space.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { brightness: 0.45, attack: 3, decay: 14, spread: 0.5, volume: -17 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { width: 0.7, mix: 0.4 } }],
  },

  // Grain: whatever recording is loaded, taken apart
  {
    id: 'far-north-grains-thrown-upward',
    name: 'Grains thrown upward',
    category: 'pad',
    description:
      'Whatever sound is loaded, held as a slow cloud with many of its grains thrown up an octave, in an eight-second hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: { density: 12, octaves: 0.7, attack: 2.5, release: 6, volume: -17.7 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, mix: 0.35 } }],
  },
  {
    id: 'far-north-backwards-weather',
    name: 'Backwards weather',
    category: 'pad',
    description:
      'Whatever sound is loaded, read backwards in long overlapping grains, pushed through a console stage and left to hang.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { scan: -0.2, size: 1200, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { output: -7.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },

  // Handpan: struck steel treated like the guitar
  {
    id: 'far-north-steel-without-strike',
    name: 'Steel without strike',
    category: 'bell',
    description:
      'A steel pan with every strike faded out so only the ring swells in, with an octave climbing behind it.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { decay: 8, touch: 0.15, volume: -4.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 350 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { shimmer: 0.65, mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'far-north-tongue-drum-shadow',
    name: 'Tongue drum shadow',
    category: 'bell',
    description:
      'A tongue drum played with soft fingers, each note shadowed by a reversed copy an octave below, in a cathedral.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 9, touch: 0.1, cavity: 0.8, volume: -7 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 1400, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'keys',
  },

  // Harp: the harp at the side of the stage
  {
    id: 'far-north-harp-in-the-nave',
    name: 'Harp in the nave',
    category: 'plucked',
    description:
      'A concert harp picked slowly with its other strings ringing in sympathy, doubled a few cents wide, in a cathedral.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { decay: 1.5, halo: 0.7, volume: -6 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'far-north-harp-swept-upward',
    name: 'Harp swept upward',
    category: 'plucked',
    description:
      'Each key sweeps the harp upward, and a rain of small grains an octave higher falls back through the tail.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { touch: 0.5, sweep: 1.2, volume: -1.7 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.35 } },
    ],
  },

  // Ladder bass: the bass guitar, struck and fuzzed
  {
    id: 'far-north-drumstick-on-the-bass',
    name: 'Drumstick on the bass',
    category: 'keys',
    description:
      'A bass string hit with a drumstick: a dull thump that opens and falls back, through a warm stack in a room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { sub: 0.4, cutoff: 300, contour: 0.6, decay: 4, volume: -1.8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'far-north-fuzz-under-the-floor',
    name: 'Fuzz under the floor',
    category: 'keys',
    description:
      'A held bass note with two oscillators beating, pushed through a fuzz until it rasps like a bowed string, in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { cutoff: 420, drive: 0.6, volume: -9 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.7, push: 1, lowCut: 40, highCut: 4500, output: -8 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Mallets: the real glockenspiel and the celesta
  {
    id: 'far-north-small-steel-bars',
    name: 'Small steel bars',
    category: 'bell',
    description:
      'A glockenspiel played with hard beaters and no resonators, a short loop of itself an octave up behind it, on a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.9, decay: 1.5, width: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-celesta-after-hours',
    name: 'Celesta after hours',
    category: 'bell',
    description:
      'A celesta played softly with the dampers half off, cut to a record with its crackle and slow warp, in an empty hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.25, decay: 1.4, damper: 0.5, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'New pressing',
        params: { surface: 0.2, warp: 0.3, crackle: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'keys',
  },

  // Outdoors: the valley the session was recorded in
  {
    id: 'far-north-meltwater',
    name: 'Meltwater',
    category: 'texture',
    description:
      'A stream of meltwater running over stones, close to the microphone, with far echoes of the valley behind it.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.6, distance: 0.35, tone: 0.6, volume: -2 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.2 } }],
  },
  {
    id: 'far-north-plover-on-the-heath',
    name: 'Plover on the heath',
    category: 'texture',
    description:
      'Sparse whistled bird calls from far across open ground, on a portable tape recorder with its hiss left in.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.3, distance: 0.7, movement: 0.6, volume: 3 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 5, mix: 0.25 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.35 } },
    ],
  },

  // Pedal steel: a slide treated like the bow
  {
    id: 'far-north-bar-and-volume-pedal',
    name: 'Bar and volume pedal',
    category: 'plucked',
    description:
      'Steel strings under a bar with every note swelled in by the pedal, warmed by a triode, in a space seconds across.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.8, vibrato: 5, tone: 2600, volume: -6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4, output: -7.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-long-slides-echoing',
    name: 'Long slides echoing',
    category: 'plucked',
    description:
      'Notes that slide a long way into each other under the bar, with three tape heads and a long spring behind.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { glide: 650, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },

  // Sampler: whatever recording is loaded, as the band would treat it
  {
    id: 'far-north-end-to-start',
    name: 'End to start',
    category: 'texture',
    description:
      'Whatever sound is loaded, played from its end to its start, overdriven and let out into a very large space.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { attack: 0.05, release: 2.5, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.45, output: -6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'far-north-loop-wearing-through',
    name: 'Loop wearing through',
    category: 'pad',
    description:
      'Whatever sound is loaded, looped an octave down with a wobble, on a tape that is wearing through, in a hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.5, release: 4, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { output: -6.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // String machine: the string keyboard from the practice room
  {
    id: 'far-north-paper-strings',
    name: 'Paper strings',
    category: 'string',
    description:
      'A string ensemble keyboard, slow and dark, turning in a six-stage phaser, in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2.5, release: 5, volume: -6.7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'far-north-top-octave-only',
    name: 'Top octave only',
    category: 'string',
    description:
      'Only the top octave of the string keyboard, thin and high, its short tail read back through reversed grains an octave up.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.8, tone: 12000, volume: -8 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Rising fifths',
        params: { bloom: 1, decay: 4, interval: 1, mix: 0.5 },
      },
    ],
  },

  // Tanpura: a drone lute, driven or bare
  {
    id: 'far-north-drone-strings-driven',
    name: 'Drone strings, driven',
    category: 'drone',
    description:
      'Four drone strings plucked round and round with the bridge rasping, driven until the overtones run together, in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.85, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.55, output: 1.8 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, mix: 0.4 } },
    ],
  },
  {
    id: 'far-north-plain-wire',
    name: 'Plain wire',
    category: 'drone',
    description:
      'Four plain strings with no rasp at the bridge, each pluck turned down so mostly the ring arrives, in a hall that hums a low oh.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 6, decay: 25, volume: -2.7 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 700, depth: 0.6, retrigger: 0 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
    preview: 'hold',
  },

  // Tape orchestra: the tape-replay keyboard
  {
    id: 'far-north-tape-flutes-combo',
    name: 'Tape flutes, combo',
    category: 'wind',
    description:
      'Flutes from a tape-replay keyboard through a small combo with its spring on: hollow, wobbling and close.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.5, attack: 0.05, volume: -6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { output: -6.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'far-north-reel-of-voices',
    name: 'Reel of voices',
    category: 'voice',
    description:
      'A choir on tired tape, wobbling and dropping out, with slow backwards swells of itself, in a cathedral.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 0.7, attack: 0.8, release: 3, volume: -9.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // Thesis: wind in pipes
  {
    id: 'far-north-mirrored-whistle-chord',
    name: 'Mirrored whistle chord',
    category: 'pad',
    description:
      'One key becomes a chord of narrow whistling bands mirrored around a centre note, breathing slowly, in a cathedral.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 85, attack: 2, release: 5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -6, gain: 9.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'far-north-wind-in-the-pipes',
    name: 'Wind in the pipes',
    category: 'texture',
    description:
      'Wide, breathy bands of noise more like wind than notes, drifting in a dark minor through a transformer.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { resonance: 12, width: 40, attack: 2.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 4000, mix: 0.35 } },
    ],
  },

  // Tine piano: the electric piano
  {
    id: 'far-north-tines-side-to-side',
    name: 'Tines side to side',
    category: 'keys',
    description:
      'Soft tines that pan slowly from side to side, each note answered by a reversed copy an octave up, in a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0.5, tremoloRate: 0.6, volume: -15 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'far-north-tines-with-an-edge',
    name: 'Tines with an edge',
    category: 'keys',
    description:
      'An electric piano hit hard so the pickup barks, through a small combo turned up and its dark spring.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bark: 0.7, drive: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.5, output: -3.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { width: 0.6 } },
    ],
  },

  // Wavetable: vowels and reeds from a table
  {
    id: 'far-north-choir-never-breathing',
    name: 'Choir never breathing',
    category: 'pad',
    description:
      'A wavetable moving slowly through vowel shapes, like a choir that never takes a breath, in a cathedral.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { rate: 0.04, attack: 3, spread: 0.4, volume: -13 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
  },
  {
    id: 'far-north-reeds-without-bellows',
    name: 'Reeds without bellows',
    category: 'organ',
    description:
      'A wavetable held near its reed end: a harmonium with no bellows to breathe, a worn cassette of it played in a small room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.1, motion: 0.15, sub: 0.5, attack: 0.3, release: 1.5, volume: -10 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3, output: -5 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // West coast: folded tones, struck and held
  {
    id: 'far-north-soft-mallet-octaves',
    name: 'Soft mallet, octaves',
    category: 'bell',
    description:
      'A soft mallet on a pure tone that folds slightly as it is struck, with octave echoes stacked above it, on a small plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 2, colour: 0.5, volume: 0.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate' },
    ],
  },
  {
    id: 'far-north-folding-as-it-grows',
    name: 'Folding as it grows',
    category: 'pad',
    description:
      'A tone that folds over itself as it swells, brighter the longer it is held, through a triode in a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 3, sustain: 1, drift: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.35, output: -3.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },

  // Zither: wires hammered and wires left to ring
  {
    id: 'far-north-rolled-paired-strings',
    name: 'Rolled paired strings',
    category: 'plucked',
    description:
      'Paired strings hammered in a fast soft roll, the sympathetic strings ringing on behind, in a cathedral.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 10, decay: 9, volume: -12 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } }],
  },
  {
    id: 'far-north-one-string-swelling',
    name: 'One string swelling',
    category: 'plucked',
    description:
      'A single felted string with its strike faded out so it seems bowed, the open strings humming behind it, in a hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 10, release: 6, sympathy: 0.5, volume: -8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
]
