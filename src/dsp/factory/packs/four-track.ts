import { type FactoryPreset } from '../types'

// A voice, a guitar, an electric piano and an upright, each recorded to a
// cassette four-track in a damp house near the sea, with the reverb turned up
// until the words are gone and the hiss left in.

export const PRESETS: readonly FactoryPreset[] = [
  // Choir: the layered voice at the middle of it all.
  {
    id: 'four-track-fog-voice',
    name: 'Fog voice',
    category: 'voice',
    description:
      'A soft section on a closed vowel, breathy and low-passed, taped to cassette and left far back in a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0.85,
        voice: 1.2,
        motion: 0.2,
        breath: 0.55,
        ensemble: 0.5,
        vibrato: 4,
        attack: 1.4,
        release: 4,
        tone: 2600,
        width: 0.6,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.5, mix: 0.6 } },
    ],
  },
  {
    id: 'four-track-two-takes',
    name: 'Two takes',
    category: 'voice',
    description:
      'One close voice sung twice a few cents apart, sent to a dark hall and the whole of it recorded to cassette.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.9,
        voice: 1.22,
        breath: 0.45,
        vibrato: 8,
        vibratoRate: 4.8,
        attack: 0.5,
        release: 1.8,
        tone: 3000,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thick double', params: { mix: 0.45 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { midDecay: 4, damping: 3200, mix: 0.5 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.3, hiss: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'four-track-heard-through-plaster',
    name: 'Heard through plaster',
    category: 'voice',
    description:
      'Voices from the next room: played down a corridor and cut off above two kilohertz, with tape hiss in front.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0.15,
        voice: 1.1,
        breath: 0.2,
        ensemble: 0.8,
        vibrato: 6,
        attack: 0.7,
        release: 2.2,
        tone: 4000,
        volume: -9,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { drive: 0.15, distance: 0.5, room: 0.75 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { air: -8, highCut: 2000 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
    ],
  },
  {
    id: 'four-track-sung-in-rounds',
    name: 'Sung in rounds',
    category: 'voice',
    description:
      'A sung line caught on a three-second tape loop, each phrase laid over the last and wearing away, in a hall that sings ah.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        vowel: 0.6,
        voice: 1.24,
        motion: 0.5,
        breath: 0.35,
        ensemble: 0.3,
        vibrato: 5,
        attack: 0.3,
        release: 1.2,
        tone: 3600,
        width: 0.4,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3, feedback: 0.78, wear: 0.55, spread: 0.5, mix: 0.5 },
      },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { highCut: 5000, mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'four-track-low-hymn',
    name: 'Low hymn',
    category: 'voice',
    description:
      'Low voices on a closed oh with no vibrato, through a worn cassette into a long dark hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { voice: 0.96, breath: 0.3, ensemble: 0.7, attack: 2, tone: 2200, volume: -6.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, damping: 0.65, mix: 0.45 } },
    ],
    preview: 'low',
  },
  {
    id: 'four-track-vowels-in-the-hall',
    name: 'Vowels in the hall',
    category: 'voice',
    description:
      'A section drifting slowly from vowel to vowel into a hall that sings the same vowels back, all of it on cassette.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { breath: 0.4, vibrato: 3, attack: 2.2, tone: 3200, width: 0.7, volume: -10 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Cathedral choir',
        params: { decay: 14, highCut: 4500, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { drive: 0.4, hiss: 0.3 } },
    ],
  },
  {
    id: 'four-track-breath-and-hiss',
    name: 'Breath and hiss',
    category: 'voice',
    description:
      'More air than note: a whispered chord with tape hiss that rises and falls with it, in a very large dark room.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { vowel: 0.7, voice: 1.24, motion: 0.4, attack: 1.8, tone: 4200, volume: -16 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Rides the sound', params: { level: -34, tone: -0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3800, mix: 0.45 } },
    ],
  },
  {
    id: 'four-track-slowed-chorus',
    name: 'Slowed chorus',
    category: 'voice',
    description:
      'High voices on cassette played back at half speed, an octave down and twice as slow, running together in a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { breath: 0.35, ensemble: 0.6, vibrato: 3, attack: 0.4, release: 1.5, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.25 } },
      {
        deviceId: 'half-speed',
        preset: 'Continuous octave',
        params: { highCut: 4500, mix: 0.85 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.45 } },
    ],
  },

  // Guitar: strummed slowly, through pedals and a small amplifier.
  {
    id: 'four-track-spring-tank-strum',
    name: 'Spring tank strum',
    category: 'plucked',
    description:
      'A chord drawn slowly across the strings on the neck pickup, a long dark spring behind it, on cassette.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { pickup: 1, hardness: 0.25, tone: 2400, strum: 70, warmth: 0.7, volume: -10 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Long three spring',
        params: { tone: 2400, drip: 0.2, mix: 0.45 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
    preview: 'chord',
  },
  {
    id: 'four-track-fuzz-under-fog',
    name: 'Fuzz under fog',
    category: 'plucked',
    description:
      'Low strings strummed into a dark fuzz, then a long plate with the top taken off: more murk than guitar.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { pickup: 0.5, hardness: 0.6, sustain: 16, strum: 45, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz bed', params: { drive: 0.55, output: -7 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3000 } },
    ],
    preview: 'chord',
  },
  {
    id: 'four-track-picked-far-plate',
    name: 'Picked, far plate',
    category: 'plucked',
    description:
      'Single soft notes on the neck pickup with one short tape repeat, a late long plate and tape hiss under the gaps.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { pickup: 1, hardness: 0.35, tone: 2600, strum: 0, warmth: 0.5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 210, mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { predelayMs: 70, mix: 0.5 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
    ],
  },
  {
    id: 'four-track-volume-knob-swell',
    name: 'Volume knob swell',
    category: 'plucked',
    description:
      'Chords faded in by hand so no pick is heard, in a hall that hums oo behind them, through a worn cassette.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 1.8, tone: 2400, warmth: 0.65, volume: 6 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 9, mix: 0.45 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.35, output: 5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'four-track-delay-pedal-murk',
    name: 'Delay pedal murk',
    category: 'plucked',
    description:
      'Paired strings picked softly into a long dull bucket-brigade echo that blurs them, then a cathedral of a reverb.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: {
        pickup: 0.8,
        hardness: 0.4,
        sustain: 14,
        tone: 2800,
        strum: 24,
        shimmer: 0.8,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { time: 780, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-slack-low-strings',
    name: 'Slack low strings',
    category: 'plucked',
    description:
      'Low strings tuned down and thumbed, with a slow amp tremolo and a dark spring, recorded to cassette.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { pickup: 0.4, position: 0.12, hardness: 0.45, tone: 1800, strum: 50, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.2, depth: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 3, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'four-track-small-amp-far-mic',
    name: 'Small amp, far mic',
    category: 'plucked',
    description:
      'A thin bridge-pickup guitar through a small combo, heard from the far end of a long stone room and taped there.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        pickup: 0.2,
        position: 0.09,
        hardness: 0.65,
        sustain: 7,
        tone: 3400,
        warmth: 0.4,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.45, distance: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { drive: 0.4 } },
    ],
  },
  {
    id: 'four-track-arpeggio-on-a-loop',
    name: 'Arpeggio on a loop',
    category: 'plucked',
    description:
      'Short soft notes that a looper keeps under the hands at half speed, an octave down, in a hall with tape hiss.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { pickup: 0.6, position: 0.12, hardness: 0.4, sustain: 4, tone: 3000, volume: 1.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { length: 3, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.55, mix: 0.4 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -45, tone: -0.2 } },
    ],
  },

  // Acoustic guitar: strummed close to one microphone, doubled, then sunk.
  {
    id: 'four-track-porch-strum',
    name: 'Porch strum',
    category: 'plucked',
    description:
      'A steel-string chord strummed slowly with the fingers, on cassette, with a long plate turned well up.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { body: 0.85, nail: 0.35, sustain: 6, release: 3, tone: 0.45, strum: 55, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'four-track-doubled-acoustic',
    name: 'Doubled acoustic',
    category: 'plucked',
    description:
      'Two takes of the same picking, a little apart in pitch and time, in a hall and bounced through a worn cassette.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { nail: 0.3, tone: 0.5, strum: 25, volume: -2 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Detuned double',
        params: { detune: 12, delay: 30, tone: 7000, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { drive: 0.4, noise: 0.3 } },
    ],
  },
  {
    id: 'four-track-thumb-and-hiss',
    name: 'Thumb and hiss',
    category: 'plucked',
    description:
      'Close and almost dry: a thumb on steel strings, levelled by a slow compressor, with tape hiss that swells in the gaps.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { sustain: 3.5, tone: 0.4, strum: 30, volume: 3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Mic' },
      { deviceId: 'noise-floor', preset: 'Breathing recorder', params: { level: -36 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'four-track-twelve-strings-low-tide',
    name: 'Twelve strings, low tide',
    category: 'plucked',
    description:
      'Twelve strings strummed softly with the top rolled off, drifting in a slow chorus into a very large dark room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { nail: 0.4, tone: 0.4, strum: 50, release: 3, volume: -0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 3500, mix: 0.55 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'four-track-nylon-under-vowels',
    name: 'Nylon under vowels',
    category: 'plucked',
    description:
      'Round nylon notes low-passed until only the body is left, with a low hall that hums an oh behind them.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.1, tone: 0.4, volume: 0.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 1800 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-picking-and-worn-echo',
    name: 'Picking and worn echo',
    category: 'plucked',
    description:
      'A picked steel-string figure with a thin, wavering tape echo trailing it into a damped hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { position: 0.14, nail: 0.65, sustain: 4, strum: 30, volume: 0 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 540, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.35 } },
    ],
  },
  {
    id: 'four-track-backwards-strum',
    name: 'Backwards strum',
    category: 'plucked',
    description:
      'Each strum comes back reversed, swelling up to where it began, in a long plate on cassette.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { body: 0.9, tone: 0.45, strum: 60, volume: -4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1400, mix: 0.6 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
    preview: 'chord',
  },

  // Tine piano: voiced dark and barking, as the old reed electric piano.
  {
    id: 'four-track-small-hours-keys',
    name: 'Small hours keys',
    category: 'keys',
    description:
      'An electric piano voiced dark and a little overdriven, with a mono tremolo like a reed piano, on cassette in a long plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: {
        bell: 0.15,
        bark: 0.45,
        tremolo: 0.35,
        tremoloRate: 5.2,
        pan: 0,
        tone: 0.3,
        drive: 0.3,
        volume: -17.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'four-track-tremolo-and-spring',
    name: 'Tremolo and spring',
    category: 'keys',
    description:
      'The electric piano with its tremolo deep and in mono, a two-spring tank behind it and the hum of an amplifier left on.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { bell: 0.25, tremolo: 0.7, tremoloRate: 4.6, tone: 0.4, volume: -15 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 3, mix: 0.4 } },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -44 } },
    ],
  },
  {
    id: 'four-track-barked-chords-far-off',
    name: 'Barked chords, far off',
    category: 'keys',
    description:
      'Chords struck hard so the pickup barks, through a small speaker into a cathedral, with the top taken off afterwards.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { decay: 1.8, hardness: 0.85, release: 0.6, tone: 0.4, drive: 0.55, volume: -15 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.1 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3500 } },
    ],
    preview: 'chord',
  },
  {
    id: 'four-track-keys-caught-in-fog',
    name: 'Keys caught in fog',
    category: 'keys',
    description:
      'Soft long notes that a sustainer catches and keeps under themselves as a dark bed, with a whispering hall behind.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.4, hardness: 0.45, tremolo: 0, tone: 0.35, volume: -20 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 0.8, decay: 20, mix: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering hall', params: { decay: 6, mix: 0.35 } },
    ],
  },
  {
    id: 'four-track-electric-piano-drone',
    name: 'Electric piano drone',
    category: 'keys',
    description:
      'Low fifths struck hard and driven through the small speaker of the piano itself, caught on a tape loop until they are one drone.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: {
        bell: 0.35,
        bark: 0.85,
        decay: 4,
        release: 3,
        hardness: 0.8,
        tremolo: 0.1,
        tone: 0.6,
        drive: 0.6,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: {
          drive: 0.55,
          bass: 0.4,
          treble: -0.2,
          distance: 0.1,
          room: 0.2,
          noise: 0.1,
          output: 6,
        },
      },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2.6, feedback: 0.75, wear: 0.45, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'four-track-half-speed-keys',
    name: 'Half-speed keys',
    category: 'keys',
    description:
      'Bell-like notes on a seasick cassette, heard again at half speed an octave below, in a small dark plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.7, hardness: 0.6, release: 0.8, tremolo: 0, tone: 0.5, volume: -12.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.7, speed: 3, hiss: 0.35 } },
      { deviceId: 'half-speed', preset: 'Half speed', params: { smooth: 1, mix: 0.6 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { decay: 0.75, mix: 0.35 } },
    ],
  },
  {
    id: 'four-track-three-heads-one-hall',
    name: 'Three heads, one hall',
    category: 'keys',
    description:
      'A soft electric piano repeated by three dull tape heads until the phrase blurs, in a damped hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bark: 0.25, hardness: 0.5, tremolo: 0.2, tremoloRate: 2.2, tone: 0.4, volume: -12 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 460, feedback: 0.6, highCut: 2600, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
  },

  // Felt piano: an upright in a quiet house, the pedal and the room left in.
  {
    id: 'four-track-upright-no-top-end',
    name: 'Upright, no top end',
    category: 'keys',
    description:
      'A felted upright heard from another room: no top end, a hall around it and the rumble of an empty room underneath.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.8,
        hardness: 0.25,
        resonance: 0.3,
        reverbMix: 0.2,
        reverbSize: 0.4,
        polyphony: 12,
        outputDb: -15.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { air: -8, highCut: 2500 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
    ],
  },
  {
    id: 'four-track-pedal-left-down',
    name: 'Pedal left down',
    category: 'keys',
    description:
      'An upright with the pedal down so every string answers, action and pedal audible, close on cassette in a small room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.5,
        detune: 0.6,
        action: 0.6,
        pedalNoise: 0.7,
        resonance: 0.65,
        reverbMix: 0,
        sustain: 1,
        polyphony: 12,
        outputDb: -18,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'four-track-soft-pedal-sketch',
    name: 'Soft pedal sketch',
    category: 'keys',
    description:
      'Played with the soft pedal and thick felt, thump and key noise up close, printed hot to cassette with almost no room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        thump: 0.75,
        action: 0.65,
        grit: 0.4,
        resonance: 0.2,
        reverbMix: 0.1,
        soft: 1,
        polyphony: 12,
        outputDb: -14,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Hot glue',
        params: { wow: 0.15, speed: 3, hiss: 0.4, output: -2.5 },
      },
    ],
  },
  {
    id: 'four-track-piano-under-plate',
    name: 'Piano under plate',
    category: 'keys',
    description:
      'A plain upright with a long plate turned up until the hammers sit behind their own tail, then worn by a cassette.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.3,
        hardness: 0.45,
        resonance: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -20,
      },
    },
    effects: [
      { deviceId: 'dattorro', preset: 'Long plate', params: { decay: 0.93, mix: 0.65 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
    ],
  },
  {
    id: 'four-track-piano-loop-octave-down',
    name: 'Piano loop, octave down',
    category: 'keys',
    description:
      'Each phrase comes back from a tape loop at half speed, an octave under the hands and more worn every pass.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.6, resonance: 0, reverbMix: 0.1, polyphony: 12, outputDb: -14.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 4, feedback: 0.7, wear: 0.6, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { damping: 0.5, mix: 0.3 } },
    ],
  },
  {
    id: 'four-track-wavering-upright',
    name: 'Wavering upright',
    category: 'keys',
    description:
      'An upright a little out of tune on a cassette whose speed sags and comes back, in a hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.45,
        detune: 0.9,
        stiffness: 1.3,
        resonance: 0.2,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -15,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.8, flutter: 0.3, speed: 3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'four-track-piano-and-humming',
    name: 'Piano and humming',
    category: 'keys',
    description:
      'A felted piano whose hall sings back on an open vowel, as if someone hummed along, under steady tape hiss.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 0.8,
        pedalNoise: 0.2,
        resonance: 0.2,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -13.5,
      },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { resonance: 0.75, decay: 9, highCut: 5000, mix: 0.4 },
      },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
    ],
  },

  // Reed organ: one hand of held chords under everything else.
  {
    id: 'four-track-pump-organ-murk',
    name: 'Pump organ murk',
    category: 'organ',
    description:
      'A reedy pump organ with the tone closed down and a soft start, on cassette, in a long plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { celeste: 0.4, bellows: 0.6, attack: 0.5, release: 1.5, tone: 1500, volume: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'four-track-bellows-close-up',
    name: 'Bellows close up',
    category: 'organ',
    description:
      'A harmonium with one microphone almost inside it: wind, an uneven bellows and microphone air, in a small room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { sub: 0.15, reed: 0.5, breath: 0.65, bellows: 0.85, tone: 2200, volume: -14.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -38 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'four-track-drone-under-the-song',
    name: 'Drone under the song',
    category: 'drone',
    description:
      'Two low ranks tuned apart so they beat slowly, weighted by a tape preamp, in a reverb that breathes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: {
        sub: 0.1,
        octave: 0.6,
        twelfth: 0.1,
        reed: 0.5,
        celeste: 0.6,
        breath: 0.15,
        tone: 1800,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Tape weight',
        params: { drive: 0.45, lowBump: 0.1, tone: 0, output: -4.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-pipes-on-worn-tape',
    name: 'Pipes on worn tape',
    category: 'organ',
    description:
      'Slow dull pipes caught on five seconds of worn-out tape that wavers under them, in a small dark room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 1.5, release: 4, tone: 1600, volume: -12 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 5, mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'four-track-tremulant-far-end',
    name: 'Tremulant, far end',
    category: 'organ',
    description:
      'A single flute rank shaking under its tremulant, with one tape repeat, at the far end of a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { octave: 0.3, tremulant: 0.75, attack: 0.6, release: 2, tone: 3000, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 380, highCut: 4000, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'four-track-fuzzed-combo-organ',
    name: 'Fuzzed combo organ',
    category: 'organ',
    description:
      'A reedy organ chord with a dark fuzz laid over it, in a long spring, the kind of murk a cassette makes of it.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 0.3,
        octave: 0.5,
        twelfth: 0.2,
        fifteenth: 0.2,
        reed: 0.8,
        celeste: 0.4,
        tone: 2500,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Dark fuzz bed',
        params: { drive: 0.3, output: -13, mix: 0.7 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },
  {
    id: 'four-track-one-finger-organ',
    name: 'One finger organ',
    category: 'organ',
    description:
      'A single thin reed line with no sub, drifting in a slow chorus in a small chapel that sings, on a worn cassette.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0,
        octave: 0.2,
        reed: 0.6,
        celeste: 0.1,
        attack: 0.25,
        release: 1,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { decay: 3, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
    ],
    preview: 'line',
  },

  // Atmosphere: what the microphone heard between takes.
  {
    id: 'four-track-rain-on-the-recorder',
    name: 'Rain on the recorder',
    category: 'texture',
    description:
      'Steady rain on a roof taped through a cheap microphone and pushed hard onto cassette, with the small room it fell on.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { tone: 0.15, size: 0.45, attack: 2, release: 5, width: 0.7, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { drive: 0.75, hiss: 0.15, tone: 0.15 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'four-track-shore-from-indoors',
    name: 'Shore from indoors',
    category: 'texture',
    description:
      'The sea heard from indoors: slow waves with nothing above two kilohertz, a hall around them and tape hiss.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.45, tone: 0.3, attack: 2.5, width: 0.6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { air: -8, highCut: 1800 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
    ],
  },

  // Aurora: a brass-and-string pad treated as more hummed voices.
  {
    id: 'four-track-overcast-pad',
    name: 'Overcast pad',
    category: 'pad',
    description:
      'A dark chord that arrives slowly and never opens far, in a long damped room, the room then recorded to cassette.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 480, contour: 0.5, attack: 3, swell: 0.8, release: 6, volume: -12 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.6, mix: 0.2 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },
  {
    id: 'four-track-hummed-chord',
    name: 'Hummed chord',
    category: 'pad',
    description:
      'A resonant pad voiced like closed-mouth humming, with a hall that sings oo behind it, through a worn cassette.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: {
        brilliance: 900,
        lowCut: 250,
        resonance: 0.5,
        attack: 1.4,
        detune: 14,
        volume: -12.5,
      },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 7, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.35 } },
    ],
  },

  // Bow: the guitar held singing, and one low string.
  {
    id: 'four-track-sustained-guitar-haze',
    name: 'Sustained guitar haze',
    category: 'string',
    description:
      'Guitar strings held singing with a slow start and a dull tone, warmed by a tape preamp, in a long plate on cassette.',
    instrument: {
      deviceId: 'bowed-string',
      params: {
        mode: 1,
        attack: 2,
        release: 4,
        brightness: 0.3,
        vibrato: 0.08,
        detune: 5,
        volume: -19.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },
  {
    id: 'four-track-one-low-string',
    name: 'One low string',
    category: 'string',
    description:
      'A low string bowed lightly and without hurry, on a worn cassette, in a seven-second stone hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1.2, release: 3, pressure: 0.4, vibrato: 0.1, volume: -12 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Chamber strings: a few players, muted, a long way from the microphone.
  {
    id: 'four-track-muted-five-on-cassette',
    name: 'Muted five on cassette',
    category: 'string',
    description:
      'Five muted players with no vibrato swelling in slowly, on cassette, in a six-second hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 2, scatter: 0.5, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.55, mix: 0.45 } },
    ],
  },
  {
    id: 'four-track-bow-hair-mist',
    name: 'Bow hair mist',
    category: 'string',
    description:
      'Bows with almost no weight on them: air and rosin smeared until the notes hang, in a damped hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 3, attack: 1.6, release: 3, air: 0.9, width: 0.45, volume: -10 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.85, highCut: 6000, width: 0.45, mix: 0.6 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { damping: 3500, mix: 0.4 } },
    ],
  },

  // Chord harp: the strum-plate toy, slow and dull.
  {
    id: 'four-track-strum-plate-at-night',
    name: 'Strum plate at night',
    category: 'plucked',
    description:
      'A slow sweep up and down four octaves of soft strings with the tone shut, through a worn cassette into a dull six-second hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { tone: 0.25, pad: 0.3, volume: -10 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 6, tone: 3500, mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-brushed-chord-wet-tape',
    name: 'Brushed chord, wet tape',
    category: 'plucked',
    description:
      'One octave of dull strings with the pluck faded out of each chord, and a thin wavering tape echo trailing into a hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { strum: 12, sustain: 6, pad: 0.15, volume: -4.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 300 } },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 700, feedback: 0.5, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, midDecay: 3.5, mix: 0.4 } },
    ],
  },

  // Clarinet: a quiet reed standing in for the voice.
  {
    id: 'four-track-subtone-in-fog',
    name: 'Subtone in fog',
    category: 'wind',
    description: 'A reed blown so softly it is half breath, in a long plate and then on cassette.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.25, attack: 0.4, release: 1.2, vibrato: 0.1, volume: -9.5 },
    },
    effects: [
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },
  {
    id: 'four-track-low-reed-looped',
    name: 'Low reed, looped',
    category: 'wind',
    description:
      'A bass clarinet line laid on a loop of tape three and a half seconds long, so each note stays under the next.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.4, breath: 0.6, attack: 0.5, release: 1.5, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3.5, feedback: 0.7, wear: 0.5, spread: 0.4, mix: 0.45 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { damping: 0.6, mix: 0.3 } },
    ],
  },

  // Drone: fog, and a minor chord left running under the hiss.
  {
    id: 'four-track-wandering-sine-fog',
    name: 'Wandering sine fog',
    category: 'drone',
    description:
      'A soft cluster of sines with air in it, every partial wandering and slowly phasing, on cassette in a very large room.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { cutoff: 1100, attack: 4, release: 12, width: 0.7, volume: -12.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { width: 0.3, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 4000, mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-minor-under-hiss',
    name: 'Minor under hiss',
    category: 'drone',
    description:
      'A dark just minor chord over a deep sub, with tape hiss that comes up whenever it falls quiet, in a breathing reverb.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { attack: 3, cutoff: 700, movement: 0.7, volume: -8.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Breathing recorder', params: { level: -38 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },

  // Dusk: a chorus polysynth borrowed for one overdub.
  {
    id: 'four-track-borrowed-string-pad',
    name: 'Borrowed string pad',
    category: 'pad',
    description:
      'A plain sawtooth pad under both choruses with the filter low and a slow start, through a worn cassette into a long plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: {
        wave: 0,
        cutoff: 1100,
        envelope: 0.15,
        attack: 1.8,
        release: 5,
        chorus: 3,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-sub-and-tape-weight',
    name: 'Sub and tape weight',
    category: 'pad',
    description:
      'A square wave and its sub octave with the filter nearly shut, thickened by a tape preamp, in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { sub: 0.15, cutoff: 1400, attack: 1.2, release: 4, volume: -10 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Tape weight',
        params: { drive: 0.45, lowBump: 0.1, tone: 0, output: -5.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },

  // Ember: a subtractive pad kept dark and unsteady.
  {
    id: 'four-track-warm-pad-sagging-tape',
    name: 'Warm pad, sagging tape',
    category: 'pad',
    description:
      'Two detuned saws behind a low filter, on a cassette that sags in pitch, with a low hall humming an oh after them.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { cutoff: 800, ampAttack: 2.2, ampRelease: 5, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.7, speed: 3, hiss: 0.3 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 9, mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-noise-and-one-note',
    name: 'Noise and one note',
    category: 'pad',
    description:
      'A low filtered drone with noise mixed into it, smeared until it hardly moves, over a bed of dull tape hiss.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { noiseLevel: 0.2, cutoff: 320, ampAttack: 2, volume: -20.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.45 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44, tone: -0.3 } },
    ],
    preview: 'low',
  },

  // Flute: breath first, pitch second.
  {
    id: 'four-track-breath-pad-on-tape',
    name: 'Breath pad on tape',
    category: 'wind',
    description:
      'Low flutes blown almost without tone, held as a chord of breath, on cassette in a cathedral of a reverb.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { blow: 0.2, attack: 1.8, release: 3.5, vibrato: 0.1, volume: -18.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'four-track-low-flute-far-shore',
    name: 'Low flute, far shore',
    category: 'wind',
    description:
      'A low flute line with little vibrato, answered by dark bucket-brigade repeats, in a long plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.5, release: 2.5, vibrato: 0.15, volume: -10 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 520, tone: 2200, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },

  // Glass: bells with a blanket over them.
  {
    id: 'four-track-glass-under-a-blanket',
    name: 'Glass under a blanket',
    category: 'bell',
    description:
      'Dull FM bells with a soft strike, everything above two and a half kilohertz removed, in a long plate on cassette.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 3, brightness: 0.25, decay: 5, attack: 0.01, velocity: 0.4, volume: -10.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2500 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.45 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },
  {
    id: 'four-track-slow-glass-chord',
    name: 'Slow glass chord',
    category: 'pad',
    description:
      'Detuned glass tones that fade in over a second or two and beat slowly, through a worn cassette into a damped hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { ratio: 3, brightness: 0.22, attack: 2, release: 6, spread: 0.5, volume: -17.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.4 } },
    ],
  },

  // Grain: whatever was on the other side of the tape.
  {
    id: 'four-track-loaded-sound-stilled',
    name: 'Loaded sound, stilled',
    category: 'pad',
    description:
      'Whatever is loaded, kept at one still moment with a slow start and no top, on cassette in a very large dark room.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { attack: 2, release: 5, tone: 3000, volume: -20.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 3200, mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-backwards-on-cassette',
    name: 'Backwards on cassette',
    category: 'pad',
    description:
      'Whatever is loaded, played backwards in long grains through a worn cassette into a hall that hums along.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { size: 1100, attack: 1.8, tone: 3500, volume: -20.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.35 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { decay: 8, highCut: 5000, mix: 0.4 },
      },
    ],
  },

  // Handpan: slowed, dulled and looped until it is hardly a drum.
  {
    id: 'four-track-steel-pan-slowed',
    name: 'Steel pan, slowed',
    category: 'bell',
    description:
      'A handpan taped and played back at half speed, each note an octave down and twice as long, in a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { touch: 0.25, shimmer: 0.2, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.75 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-tongue-drum-loop',
    name: 'Tongue drum loop',
    category: 'bell',
    description:
      'A tongue drum touched lightly, going round on three seconds of worn-out tape until it is a blur, in a long plate.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { touch: 0.1, decay: 5, volume: 1 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 3.2, feedback: 0.6, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },

  // Harp: muted and far away.
  {
    id: 'four-track-muted-harp-murk',
    name: 'Muted harp murk',
    category: 'plucked',
    description:
      'Damped harp strings into a long murky echo that dulls with every repeat, in a long stone hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.6, body: 0.9, volume: -3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-silk-strings-on-tape',
    name: 'Silk strings on tape',
    category: 'plucked',
    description:
      'Soft silk strings that bend up a little after each pluck, on cassette, in a long plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 30, halo: 0.8, volume: 1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5, hiss: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },

  // Horns: brass heard across water, or through a door.
  {
    id: 'four-track-harbour-horn',
    name: 'Harbour horn',
    category: 'wind',
    description:
      'Low brass on a fifth, slow to speak, with far scattered echoes as if over water and microphone air around it.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.35, breath: 0.15, attack: 2.2, release: 5, volume: -4 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -42 } },
    ],
    preview: 'low',
  },
  {
    id: 'four-track-flugel-behind-a-door',
    name: 'Flugel behind a door',
    category: 'wind',
    description:
      'One breathy flugelhorn with everything above fourteen hundred hertz shut out, in a long plate, on cassette.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.3, attack: 0.4, release: 2, vibrato: 0.15, volume: -5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 1400 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.45 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },

  // Ladder bass: only ever a floor under the song.
  {
    id: 'four-track-sub-under-the-tape',
    name: 'Sub under the tape',
    category: 'keys',
    description:
      'A soft sub tone with the filter almost shut, fattened by the head bump of a cassette, in a small room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { sub: 0.8, cutoff: 240, glide: 0.2, volume: -16.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { bump: 0.8, hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  {
    id: 'four-track-sliding-bass-line',
    name: 'Sliding bass line',
    category: 'keys',
    description:
      'A dull bass that opens a little on each note and slides to the next, with one dark tape repeat, in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: { cutoff: 180, emphasis: 0.4, decay: 4, glide: 0.25, volume: -4 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 500, feedback: 0.3, highCut: 2000, mix: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Mallets: soft bars, the motor off.
  {
    id: 'four-track-vibes-motor-off',
    name: 'Vibes, motor off',
    category: 'bell',
    description:
      'A vibraphone with soft mallets and no motor, ringing long, on cassette in a very long hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.15, decay: 2, damper: 0.2, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'four-track-celesta-in-the-attic',
    name: 'Celesta in the attic',
    category: 'bell',
    description:
      'A small celesta played softly, with tuned strings ringing after each note, on a cassette that wobbles, in a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.2, damper: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long resonance', params: { decay: 6, mix: 0.3 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Bells: metal a long way off.
  {
    id: 'four-track-bell-buoy',
    name: 'Bell buoy',
    category: 'bell',
    description:
      'A dull bell struck softly a long way out, with a far scattered echo and a little microphone air.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 18, damping: 0.6, hardness: 0.35, brightness: 0.3, volume: -4 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes', params: { highCut: 3500, mix: 0.4 } },
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -48, tone: -0.4 } },
    ],
  },
  {
    id: 'four-track-rubbed-bowl-ghost',
    name: 'Rubbed bowl ghost',
    category: 'bell',
    description:
      'A singing bowl rubbed rather than struck, with a dark reverb that rises backwards behind each note, on cassette.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { hardness: 0.15, brightness: 0.35, release: 0.3, volume: -10.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.45 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5, hiss: 0.3 } },
    ],
    preview: 'line',
  },

  // Outdoors: the night outside the room.
  {
    id: 'four-track-frogs-past-the-porch',
    name: 'Frogs past the porch',
    category: 'texture',
    description:
      'A frog pond some way off, taped through an open door on cassette with a little of the room it was heard from.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: { density: 0.5, distance: 0.7, width: 0.7, volume: 2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'four-track-storm-out-at-sea',
    name: 'Storm out at sea',
    category: 'texture',
    description:
      'Thunder a long way off with the top taken away, rolling round a hall, tape hiss between the rolls.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.8, distance: 0.85, volume: -2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3000 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 5, mix: 0.3 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
    ],
  },

  // Pedal steel: long notes, the pick barely there.
  {
    id: 'four-track-steel-in-the-plate',
    name: 'Steel in the plate',
    category: 'plucked',
    description:
      'Steel notes with no vibrato, faded in slowly and left to ring for most of a minute, in a long plate on cassette.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, tone: 1800, volume: -8.5 },
    },
    effects: [
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },
  {
    id: 'four-track-slide-and-tremolo',
    name: 'Slide and tremolo',
    category: 'plucked',
    description:
      'Slow slides of up to a fourth with a soft pick, through a slow amp tremolo and a two-spring tank, on a worn cassette.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { range: 5, pick: 0.3, tone: 2400, volume: -9 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2.8, depth: 0.45 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { tone: 2600, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
    ],
  },

  // Sampler: whatever is loaded, treated as one more track on the tape.
  {
    id: 'four-track-dubbed-to-one-track',
    name: 'Dubbed to one track',
    category: 'pad',
    description:
      'Whatever is loaded on a wavering loop, dubbed to cassette, summed to mono and put in a long plate.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Worn tape',
      params: { attack: 0.4, release: 2.5, tone: 2600, volume: -21 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'stereo-widener', preset: 'Mono' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-slowed-sample-smear',
    name: 'Slowed sample smear',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down with a slow start, smeared into long overlapping grains, in a damped hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.2, release: 4, tone: 3000, volume: -15.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.35 } },
    ],
  },

  // String machine: sawtooth strings with the tone closed.
  {
    id: 'four-track-string-machine-murk',
    name: 'String machine murk',
    category: 'string',
    description:
      'A string machine with the low octave up and the tone shut, on cassette, in a reverb whose tail sinks an octave.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2.2, release: 5, tone: 1200, width: 0.6, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { shimmer: 0.35, mix: 0.35 } },
    ],
  },
  {
    id: 'four-track-cellos-down-the-hall',
    name: 'Cellos down the hall',
    category: 'string',
    description:
      'The low octave alone on a fifth, played through a speaker down a corridor, with tape hiss in front.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.4, release: 3.5, tone: 900, volume: -1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { distance: 0.5, room: 0.75 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -50 } },
    ],
    preview: 'low',
  },

  // Tanpura: open strings left droning in a damp room.
  {
    id: 'four-track-open-strings-damp-room',
    name: 'Open strings, damp room',
    category: 'drone',
    description:
      'Four open strings plucked round and round with hardly any buzz, through a worn cassette, in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.15, speed: 5, decay: 10, volume: -3.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-monochord-and-hiss',
    name: 'Monochord and hiss',
    category: 'drone',
    description:
      'Plain strings with no buzz at all, plucked slowly and detuned so they beat, over tape hiss in a long dark reverb.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 6, detune: 5, volume: -5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -40 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
  },

  // Tape orchestra: a tape-replay keyboard, itself recorded to tape.
  {
    id: 'four-track-tape-choir-far-back',
    name: 'Tape choir, far back',
    category: 'voice',
    description:
      'A choir on tired tape that wobbles and drops out, far back in a long plate with the top taken off.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { attack: 0.6, release: 2, volume: -11.5 },
    },
    effects: [
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3500 } },
    ],
  },
  {
    id: 'four-track-cellos-half-speed-reel',
    name: 'Cellos, half-speed reel',
    category: 'string',
    description:
      'Cellos from tape at half speed, an octave down and hissing, with dull echoes of earlier bars drifting back, in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { age: 0.6, hiss: 0.35, tone: -0.1, volume: -9 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { reach: 12, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Thesis: bands of noise, closer to whispering than to pitch.
  {
    id: 'four-track-whispered-chord',
    name: 'Whispered chord',
    category: 'pad',
    description:
      'Wide bands of noise around one key, nearer to whispering than to pitch, on cassette in a long plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: { center: 60, resonance: 12, width: 60, attack: 1.5, release: 4, breatheRate: 0.2 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 6, outputGain: -7.5 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'four-track-wind-in-the-gutter',
    name: 'Wind in the gutter',
    category: 'texture',
    description:
      'Broad dark bands of noise on a low fifth, their pitch wandering like wind across a pipe, in a reverb that breathes.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { resonance: 18, attack: 2, release: 5, scale: 4, root: 2 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 6, outputGain: -5.5 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { damping: 0.6, mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Wavetable: vowels and hollow tones with the lid shut.
  {
    id: 'four-track-vowel-pad-lid-shut',
    name: 'Vowel pad, lid shut',
    category: 'pad',
    description:
      'A wavetable moving slowly between vowels behind a low filter, slow to arrive, on cassette in a damped hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { position: 0.7, rate: 0.04, cutoff: 1400, attack: 2.5, release: 6, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-hollow-fog',
    name: 'Hollow fog',
    category: 'pad',
    description:
      'Hollow tones under a filter at nine hundred hertz, doubled a few cents apart, in a very large room, through a worn cassette.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { cutoff: 900, resonance: 0.2, attack: 3, spread: 0.6, volume: -12 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { highCut: 3000, width: 0.8, mix: 0.4 },
      },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
    ],
  },

  // West coast: woody plucks and one folding drone.
  {
    id: 'four-track-wooden-plucks-wet-road',
    name: 'Wooden plucks, wet road',
    category: 'plucked',
    description:
      'Soft dull plucks that darken as they fade, with a thin wavering tape echo behind them, in a long plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 2.2, colour: 0.3, volume: -2.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 400, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'four-track-folding-drone-dark-well',
    name: 'Folding drone, dark well',
    category: 'drone',
    description:
      'A low tone that slowly folds over on itself, in a dark cave of short echoes, recorded to cassette.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.5, attack: 2, colour: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },

  // Zither: a box of strings on the stairs.
  {
    id: 'four-track-zither-on-the-stairs',
    name: 'Zither on the stairs',
    category: 'plucked',
    description:
      'A slow strum of fifths and octaves with a dull pick, on cassette, in a hall that rings for seven seconds.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 220, brightness: 0.3, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'four-track-hammered-string-pad',
    name: 'Hammered string, pad',
    category: 'plucked',
    description:
      'Single strings struck with felt, a dark pad growing out of them and staying after, in a long plate, through a worn cassette.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 8, release: 5, sympathy: 0.5, volume: -9 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        params: {
          rise: 1.2,
          fall: 18,
          sensitivity: 0.45,
          octaves: 0,
          brightness: 1600,
          ensemble: 0.5,
          movement: 0.35,
          lowCut: 150,
          mix: 0.32,
        },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.4 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
    ],
  },
]
