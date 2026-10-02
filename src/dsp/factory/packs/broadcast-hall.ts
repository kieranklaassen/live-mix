import { type FactoryPreset } from '../types'

// Old Broadcast Hall: a felt-damped upright with its mechanism in the microphone, a chorus
// polysynth and a tape echo, in a wooden radio hall by the river in Berlin.

export const PRESETS: readonly FactoryPreset[] = [
  // felt-piano: the upright with the cloth strip down, heard from inside the case
  {
    id: 'broadcast-hall-moderator-upright',
    name: 'Moderator upright',
    category: 'keys',
    description:
      'A cloth strip between hammer and string and microphones inside the case: keys, pedal and wood as loud as the notes.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 0.95,
        hardness: 0.2,
        thump: 0.7,
        action: 0.7,
        pedalNoise: 0.6,
        reverbMix: 0,
        width: 0.7,
        polyphony: 16,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys', params: { makeup: -1 } },
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -46 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'broadcast-hall-neighbours-asleep',
    name: 'Neighbours asleep',
    category: 'keys',
    description:
      'Played so nobody wakes: soft pedal down, nearly as much key noise as tone, on quarter-inch tape.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 1,
        hardness: 0.1,
        soft: 1,
        thump: 0.45,
        action: 0.9,
        pedalNoise: 0.8,
        grit: 0.2,
        resonance: 0.3,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.15, hiss: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'broadcast-hall-pedal-down-chamber',
    name: 'Pedal down chamber',
    category: 'keys',
    description:
      'The sustain pedal held so every string answers, sent to a loudspeaker in a bare chamber and recorded back.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        sustain: 1,
        resonance: 0.8,
        pedalNoise: 0.5,
        reverbMix: 0,
        polyphony: 10,
        outputDb: -15,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.45, room: 0.8 } },
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
    ],
  },
  {
    id: 'broadcast-hall-upright-and-echo',
    name: 'Upright and echo',
    category: 'keys',
    description:
      'The damped upright into a single tape head half a second behind, each repeat duller, with a small plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        hardness: 0.3,
        thump: 0.4,
        resonance: 0.3,
        reverbMix: 0,
        polyphony: 16,
        outputDb: -13,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 560, feedback: 0.6, highCut: 3200, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'broadcast-hall-one-string-each',
    name: 'One string each',
    category: 'keys',
    description:
      'One string to a note and an open soundboard: no beating, a harp-like top, other strings answering it in the hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.35,
        hardness: 0.45,
        detune: 0,
        stiffness: 0.7,
        thump: 0.35,
        action: 0.5,
        resonance: 0.7,
        reverbMix: 0,
        width: 0.6,
        polyphony: 16,
        outputDb: -15,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the melody', params: { mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-tall-upright',
    name: 'Tall upright',
    category: 'keys',
    description:
      'Bass strings as long as the room is high: low notes with even overtones, a heavy thump and a long wooden decay.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.4,
        hardness: 0.4,
        detune: 0.3,
        stiffness: 0.3,
        thump: 0.6,
        resonance: 0.8,
        damper: 0.7,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -20,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { low: 2, air: -2 } },
      {
        deviceId: 'zita-rev1',
        preset: 'Hall',
        params: { lowDecay: 4.5, midDecay: 2.5, mix: 0.3 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'broadcast-hall-one-ribbon-microphone',
    name: 'One ribbon microphone',
    category: 'keys',
    description:
      'The upright through a single old microphone and a valve preamp: mono, dark and a little rough when played hard.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.7,
        hardness: 0.3,
        grit: 0.25,
        width: 0,
        reverbMix: 0,
        polyphony: 12,
        outputDb: -12,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Hot valve',
        params: { drive: 0.45, noise: 0.2, tone: 0.35, output: -9 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'broadcast-hall-stage-at-soundcheck',
    name: 'Stage at soundcheck',
    category: 'keys',
    description:
      'The piano on the stage with nobody in the hall, heard from the tenth row over the rumble of the room itself.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.5,
        hardness: 0.45,
        reverbMix: 0,
        width: 0.7,
        polyphony: 16,
        outputDb: -15,
      },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Hall', params: { preDelay: 40, mix: 0.5 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
    ],
  },
  {
    id: 'broadcast-hall-half-speed-overdub',
    name: 'Half-speed overdub',
    category: 'keys',
    description:
      'Each phrase comes back under itself an octave down and twice as slow, on tape, with a small plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { resonance: 0.2, reverbMix: 0, polyphony: 16, outputDb: -13 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { highCut: 3500, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },

  // dusk: the chorus polysynth, for arpeggios into the echo and for slow pads
  {
    id: 'broadcast-hall-echo-arpeggio',
    name: 'Echo arpeggio',
    category: 'keys',
    description:
      'Half-closed sawtooth notes from the chorus polysynth into a dotted tape echo, fed back until the pattern blurs.',
    instrument: {
      deviceId: 'dusk',
      params: {
        wave: 0,
        sub: 0.2,
        cutoff: 1100,
        resonance: 0.3,
        envelope: 0.45,
        attack: 0.004,
        release: 0.35,
        chorus: 1,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 375, feedback: 0.7, heads: 3, highCut: 3500, spread: 0.6, mix: 0.45 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-slow-slider-pad',
    name: 'Slow slider pad',
    category: 'pad',
    description:
      'A chord that starts shut and opens slowly for as long as it is held, like a filter slider pushed up by degrees.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: {
        cutoff: 220,
        resonance: 0.35,
        envelope: 0.9,
        attack: 4.5,
        release: 9,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'broadcast-hall-pedal-square',
    name: 'Pedal square',
    category: 'drone',
    description:
      'A square wave and its full sub octave under a half-closed filter: a low pedal note on tape in a long spring.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 700, attack: 0.5, release: 4, volume: -15 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-both-chorus-buttons',
    name: 'Both chorus buttons',
    category: 'pad',
    description:
      'A moving pulse with both chorus settings pressed in at once, fast and watery, in a two-spring tank.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { wave: 3, sub: 0.3, cutoff: 2400, attack: 0.05, release: 1.2, volume: -15 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Fresh tape', params: { tone: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-thin-pulse-pad',
    name: 'Thin pulse pad',
    category: 'pad',
    description:
      'A thin pulse pad with its lows cut away, fading in over two seconds into three tape heads and a long plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { lowCut: 2, cutoff: 4200, attack: 2, release: 5, volume: -10 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-whistling-filter',
    name: 'Whistling filter',
    category: 'pad',
    description:
      'The filter set to sing on its own, a soft whistle two octaves over each key, with dark repeats in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { resonance: 0.96, attack: 0.3, release: 3, volume: -8.3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'broadcast-hall-chamber-polysynth',
    name: 'Chamber polysynth',
    category: 'pad',
    description:
      'The string patch printed to a reel and played through a loudspeaker at the far end of a hard-walled room.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { cutoff: 1800, attack: 0.9, release: 3, volume: -11 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.15 } },
      { deviceId: 're-amp', preset: 'Down the hall', params: { distance: 0.7, room: 0.7 } },
      { deviceId: 'stereo-widener', params: { width: 0.38 } },
    ],
  },

  // tine-piano: the electric piano, through springs, echo and its own amplifier
  {
    id: 'broadcast-hall-tines-after-hours',
    name: 'Tines after hours',
    category: 'keys',
    description:
      'Round, dark tines with a slow tremolo, a tape repeat or two behind them and a short dark spring.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { tremolo: 0.25, tremoloRate: 1.2, release: 0.6, volume: -13 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 420, feedback: 0.4, mix: 0.28 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3, width: 0.6 } },
    ],
  },
  {
    id: 'broadcast-hall-tine-and-chorus',
    name: 'Tine and chorus',
    category: 'keys',
    description:
      'Tine over tone bar: a short bell chime at the front of every note, widened by a slow chorus in a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0, volume: -10 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.45, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-amp-and-hum',
    name: 'Amp and hum',
    category: 'keys',
    description:
      'The electric piano heard from its own speaker across the room, barking a little, over fifty-cycle mains hum.',
    instrument: {
      deviceId: 'tine-piano',
      params: { bark: 0.55, tremolo: 0, drive: 0.3, volume: -14 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { distance: 0.5, room: 0.6 } },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { type: 3, level: -52 } },
    ],
  },
  {
    id: 'broadcast-hall-side-to-side',
    name: 'Side to side',
    category: 'keys',
    description:
      'Long tines carried slowly from one speaker to the other by the tremolo, on tape, in the wooden hall.',
    instrument: { deviceId: 'tine-piano', preset: 'Slow pan', params: { volume: -15 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-looped-tines',
    name: 'Looped tines',
    category: 'keys',
    description:
      'Long tines caught on four seconds of tape between two machines, each pass quieter and duller.',
    instrument: { deviceId: 'tine-piano', preset: 'Long sustain', params: { volume: -13 } },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.7, spread: 0.3, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-hot-desk-channel',
    name: 'Hot desk channel',
    category: 'keys',
    description:
      'A hard-played electric piano pushed into the red of a console channel, through a slow phaser and a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bark: 0.7, volume: -12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console edge', params: { drive: 0.55 } },
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // tape-orchestra: the tape-replay keyboard, eight seconds of tape under each key
  {
    id: 'broadcast-hall-replay-flutes',
    name: 'Replay flutes',
    category: 'wind',
    description:
      'Flutes from the tape-replay keyboard, breathy and a little unsteady, with a short echo and a spring behind.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Flutes on tape', params: { volume: -13 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.2 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'broadcast-hall-replay-choir',
    name: 'Replay choir',
    category: 'voice',
    description:
      'A choir on strips of tape that speaks slowly and wavers, repeated by three heads into the hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.3, release: 1.5, volume: -10 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.4, mix: 0.22 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'broadcast-hall-three-violins-far',
    name: 'Three violins far',
    category: 'string',
    description:
      'Three violins on worn tape with their top and bottom trimmed, set a long way back in the hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { attack: 0.05, release: 0.5, volume: -11 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 150, highCut: 5000 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { preDelay: 80, mix: 0.55 } },
    ],
  },
  {
    id: 'broadcast-hall-half-speed-cellos',
    name: 'Half-speed cellos',
    category: 'string',
    description:
      'Cellos from tape at half speed, an octave down and slow to speak, wavering on a second tape in a plate.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Cello bed', params: { volume: -10 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-reeds-run-out',
    name: 'Reeds run out',
    category: 'wind',
    description:
      'Held reeds with three and a half seconds of tape under each key: hold longer and they stop, leaving dark repeats.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { length: 3.5, age: 0.5, release: 0.6, volume: -11 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'broadcast-hall-old-reel-horns',
    name: 'Old reel horns',
    category: 'wind',
    description:
      'A horn section from aged tape, slow to speak, dull and hissing, copied to a second reel and left in the hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { age: 0.6, hiss: 0.3, attack: 0.25, release: 1.2, tone: -0.2, volume: -11 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // organ: the harmonium and the small pipe organ built into the studio
  {
    id: 'broadcast-hall-pump-organ-close',
    name: 'Pump organ close',
    category: 'organ',
    description:
      'A pumped reed organ close up: the bellows breathe unevenly under the reeds and the air is in the microphone.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { breath: 0.6, bellows: 0.9, celeste: 0.3, attack: 0.25, volume: -14.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -44 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-stone-cistern-reeds',
    name: 'Stone cistern reeds',
    category: 'organ',
    description:
      'A reed organ lowered into a round stone tank: the reeds first, then several seconds of wet echo off the walls.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { reed: 0.5, celeste: 0.4, attack: 0.4, release: 1.5, tone: 2600, volume: -14.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { preDelay: 25, mix: 0.5 } }],
  },
  {
    id: 'broadcast-hall-wooden-flue-pipes',
    name: 'Wooden flue pipes',
    category: 'organ',
    description:
      'A small rank of stopped wooden pipes with their wind audible, widened a little by a detuned copy, in a short room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.4, breath: 0.5, attack: 0.06, release: 0.3, tone: 4200, volume: -11 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-pipes-into-echo',
    name: 'Pipes into echo',
    category: 'organ',
    description:
      'Flute pipes that speak at once with a puff of wind on each note, repeated by three tape heads into a spring.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: {
        octave: 0.4,
        breath: 0.45,
        tremulant: 0,
        attack: 0.01,
        release: 0.15,
        volume: -13,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 450, feedback: 0.55, mix: 0.4 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'broadcast-hall-sixteen-foot-stop',
    name: 'Sixteen foot stop',
    category: 'drone',
    description:
      'The lowest rank almost alone: a dark pedal note through transformer iron, filling the hall from the floor.',
    instrument: {
      deviceId: 'organ',
      params: {
        sub: 1,
        octave: 0.15,
        twelfth: 0,
        fifteenth: 0,
        reed: 0.1,
        celeste: 0.2,
        breath: 0.3,
        bellows: 0.2,
        attack: 0.8,
        release: 2.5,
        tone: 900,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-organ-next-door',
    name: 'Organ next door',
    category: 'organ',
    description:
      'A full organ heard from the next studio along: no top at all, slow to arrive and slower to leave.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 2, release: 5, tone: 1000, volume: -11 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Dark', params: { lowCut: 80, highCut: 1800 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.5 } },
    ],
  },

  // ladder-bass: bass pedals under the piano stool and a one-voice analogue bass
  {
    id: 'broadcast-hall-foot-pedal-bass',
    name: 'Foot pedal bass',
    category: 'drone',
    description:
      'Bass pedals under the piano stool: two sawtooths beating slowly under a nearly closed filter, held by a foot.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 7, cutoff: 300, volume: -18 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'broadcast-hall-floorboard-sub',
    name: 'Floorboard sub',
    category: 'drone',
    description:
      'Square waves and a sub octave under a filter shut just above the note: nearly a sine, felt more than heard, pressed into tape.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 140, volume: -20 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tape Print', params: { driveDb: 24, outputDb: -18 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'broadcast-hall-low-pattern-echo',
    name: 'Low pattern echo',
    category: 'keys',
    description:
      'Short bass notes that open and shut, with two tape heads answering so that one line becomes a pattern.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Sequence bass',
      params: { cutoff: 420, decay: 0.45, volume: 1 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.5, heads: 1, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'broadcast-hall-slow-closing-pedal',
    name: 'Slow closing pedal',
    category: 'drone',
    description:
      'A low note whose filter opens with a resonant edge and takes seconds to close again, on tape in the hall.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: { emphasis: 0.5, contour: 0.9, decay: 8, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'broadcast-hall-round-lead-voice',
    name: 'Round lead voice',
    category: 'keys',
    description:
      'A round one-voice lead that slides between overlapping notes, thickened by a chorus, with three echoes and a plate.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: { cutoff: 1100, glide: 0.2, volume: 6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { mix: 0.35 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'broadcast-hall-rubber-pluck-repeats',
    name: 'Rubber pluck repeats',
    category: 'keys',
    description:
      'A resonant plucked bass, driven a little, with chorused bucket-brigade repeats in a short room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { decay: 1.5, volume: 4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 330, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },

  // mallets: the bass marimba and the small struck things kept on top of the piano
  {
    id: 'broadcast-hall-bass-marimba',
    name: 'Bass marimba',
    category: 'bell',
    description:
      'Low rosewood bars under soft yarn, each note blooming out of its tube, recorded close in the wooden room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.2, decay: 1.5, resonator: 1, width: 0.6, volume: -15 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'broadcast-hall-marimba-roll-hum',
    name: 'Marimba roll hum',
    category: 'bell',
    description:
      'Held marimba notes rolled softly until they hum like a pad, on a wavering reel in a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 9, volume: -15.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'broadcast-hall-marimba-into-echo',
    name: 'Marimba into echo',
    category: 'bell',
    description:
      'Short, dry marimba notes into a dotted tape echo, so that a slow pattern doubles itself, with a spring behind.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.5, decay: 0.7, resonator: 0.6, damper: 0.3, volume: -4 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.6, heads: 3, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'broadcast-hall-piano-top-celesta',
    name: 'Piano-top celesta',
    category: 'bell',
    description:
      'A small celesta stood on top of the piano: soft, chiming and short, over tape hiss in a still room.',
    instrument: { deviceId: 'mallets', preset: 'Celesta', params: { mallet: 0.25, volume: -8 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -48 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-motor-off-vibes',
    name: 'Motor-off vibes',
    category: 'bell',
    description:
      'Vibraphone bars struck softly with the motor switched off and left to die away in a long plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { decay: 2, damper: 0.2, volume: -7.5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'broadcast-hall-far-glockenspiel',
    name: 'Far glockenspiel',
    category: 'bell',
    description:
      'A glockenspiel played at the far side of the hall, its top trimmed, mostly room, left on tape.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, volume: -6 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { highCut: 5000 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { preDelay: 90, mix: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },

  // acoustic-guitar
  {
    id: 'broadcast-hall-dry-booth-nylon',
    name: 'Dry booth nylon',
    category: 'plucked',
    description:
      'A nylon-string guitar played with the fingertips, close to the microphone in a small dry booth.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Nylon dusk', params: { volume: 1 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -46 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-muted-steel-echo',
    name: 'Muted steel echo',
    category: 'plucked',
    description:
      'Palm-muted steel strings picked near the bridge, printed hot to tape and into two tape heads: a pattern that answers itself.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { nail: 0.4, sustain: 1.5, volume: -2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tape Print', params: { driveDb: 12, outputDb: -6 } },
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.55, heads: 1, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },

  // atmosphere
  {
    id: 'broadcast-hall-desk-left-on',
    name: 'Desk left on',
    category: 'texture',
    description:
      'The hum of valve equipment left on overnight, tuned by the key you hold, warm and almost still.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { tone: 0.3, attack: 1.5, release: 3, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Glowing triode', params: { drive: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'broadcast-hall-skylight-shower',
    name: 'Skylight shower',
    category: 'texture',
    description:
      'A steady shower on the glass roof high above the hall, evened out by tape, heard from the floor below.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { density: 1, size: 0.8, attack: 2, width: 0.6, volume: 1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // aurora
  {
    id: 'broadcast-hall-soft-brass-stack',
    name: 'Soft brass stack',
    category: 'pad',
    description:
      'A second polysynth playing soft horns: each note starts dark and swells for over a second, on tape in the hall.',
    instrument: { deviceId: 'aurora', preset: 'Soft horns', params: { attack: 1.2, volume: -14 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'broadcast-hall-string-layer-echo',
    name: 'String layer echo',
    category: 'pad',
    description:
      'Two detuned string layers, brighter than the rest of the room, with one tape head repeating them into a plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 3200, attack: 0.6, volume: -7 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 500, feedback: 0.5, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // bowed-string
  {
    id: 'broadcast-hall-woody-cello-line',
    name: 'Woody cello line',
    category: 'string',
    description:
      'One bowed cello with a little vibrato and a lot of body, close and unhurried, on clean tape in the wooden room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { pressure: 0.5, vibrato: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Fresh tape', params: { tone: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'broadcast-hall-sustained-wire',
    name: 'Sustained wire',
    category: 'string',
    description:
      'A low string held singing with no bow or pick, two seconds to fade in, while tuned strings answer in the hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: { attack: 2, release: 4, brightness: 0.35, body: 0.6, vibrato: 0, volume: -12.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { root: 2, mode: 1, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },

  // chamber-strings
  {
    id: 'broadcast-hall-quartet-on-parquet',
    name: 'Quartet on parquet',
    category: 'string',
    description:
      'Four players to a note on the parquet of the hall, with bow noise and a little vibrato, taken by a microphone across the room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { attack: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.55 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-muted-tape-bows',
    name: 'Muted tape bows',
    category: 'string',
    description:
      'A muted section with no vibrato that takes two seconds to swell, wavering slightly on tape.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 2, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // choir
  {
    id: 'broadcast-hall-gallery-voices',
    name: 'Gallery voices',
    category: 'voice',
    description:
      'A small choir singing ah from the gallery above the hall, slow to start, with the room between you and them.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { vowel: 0.15, ensemble: 0.8, vibrato: 4, attack: 1.2, release: 3, volume: -10 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { preDelay: 70, mix: 0.45 } }],
  },
  {
    id: 'broadcast-hall-hummed-bass-line',
    name: 'Hummed bass line',
    category: 'voice',
    description:
      'Low voices closed to an oo, without vibrato, humming under everything else, on tape in a small chapel.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { vowel: 1, breath: 0.25, attack: 1, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { vowel: 4, mix: 0.3 } },
    ],
    preview: 'low',
  },

  // chord-harp
  {
    id: 'broadcast-hall-chord-sweep-echo',
    name: 'Chord sweep echo',
    category: 'plucked',
    description:
      'Each key swept up three octaves of soft electronic strings, repeated a few times by tape into a spring.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { tone: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 420, feedback: 0.5, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-brushed-chord-reel',
    name: 'Brushed chord reel',
    category: 'plucked',
    description:
      'One octave of strings brushed almost at once, dull and soft with a pad underneath, on tape in a short room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { pad: 0.4, volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },

  // clarinet
  {
    id: 'broadcast-hall-bass-clarinet-close',
    name: 'Bass clarinet close',
    category: 'wind',
    description:
      'A bass clarinet blown softly a hand from the microphone: as much breath as reed, in the wooden room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { breath: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close microphone', params: { level: -46 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-late-clarinet-repeats',
    name: 'Late clarinet repeats',
    category: 'wind',
    description:
      'A clarinet note that takes two seconds to arrive, with tape repeats following it into the hall.',
    instrument: { deviceId: 'clarinet', preset: 'From nothing', params: { volume: -7.5 } },
    effects: [
      { deviceId: 'tape-echo', params: { time: 600, feedback: 0.45, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },

  // drone
  {
    id: 'broadcast-hall-organ-point-fifths',
    name: 'Organ point fifths',
    category: 'drone',
    description:
      'A low fifth of reedy partials with air in them, held nearly steady like an organ point under the piano, on tape in the hall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.85,
        wave: 0.7,
        movement: 0.25,
        sub: 0.15,
        air: 0.3,
        cutoff: 3200,
        attack: 1.2,
        release: 4,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.12 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-minor-reel-drone',
    name: 'Minor reel drone',
    category: 'drone',
    description:
      'A dark minor chord of slow partials that takes four seconds to rise, wavering on a reel in a long plate.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { attack: 4, volume: -8 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // ember
  {
    id: 'broadcast-hall-second-synth-pad',
    name: 'Second synth pad',
    category: 'pad',
    description:
      'Two detuned sawtooths under a slow filter, put through a two-voice chorus so they sit with the other polysynth.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { volume: -3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { rate: 0.5, mix: 0.4 } },
      { deviceId: 'tape-echo', params: { time: 450, feedback: 0.4, mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-soft-pluck-pattern',
    name: 'Soft pluck pattern',
    category: 'keys',
    description:
      'A short pluck of triangle and thin pulse with a quick filter snap, into a dotted tape echo and a small plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { cutoff: 700, filterDecay: 0.3, ampDecay: 1, ampRelease: 0.6, volume: 6 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.65, heads: 3, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // flute
  {
    id: 'broadcast-hall-low-flute-breath',
    name: 'Low flute breath',
    category: 'wind',
    description:
      'A low flute blown gently with a lot of air in the tone, on tape, with a two-spring tank behind it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { breath: 0.7, attack: 0.5, release: 2, volume: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-reel-pan-pipes',
    name: 'Reel pan pipes',
    category: 'wind',
    description:
      'Pan pipes with a chiff at the front of every note, printed to a reel and repeated by three tape heads.',
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { chiff: 0.7, volume: -8 } },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
    ],
  },

  // fm-glass
  {
    id: 'broadcast-hall-glass-tine-keys',
    name: 'Glass tine keys',
    category: 'keys',
    description:
      'A four-operator electric piano, cleaner than the real one until a cassette four-track dulls and wobbles it, in a short room.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { brightness: 0.3, decay: 2.2, release: 0.9, detune: 6, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-glass-bar-echo',
    name: 'Glass bar echo',
    category: 'bell',
    description:
      'Soft struck bars made of four sine operators, purer than metal, with three tape heads and the hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { brightness: 0.25, decay: 3, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // grain-synth: plays whatever is loaded
  {
    id: 'broadcast-hall-stretched-take',
    name: 'Stretched take',
    category: 'pad',
    description:
      'Whatever is loaded, played through slowly from its start, with a half-speed loop of itself underneath in a short room.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Slow stretch',
      params: { size: 220, density: 5, attack: 0.3, release: 1.5, tone: 8000, volume: -11 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-frozen-bar',
    name: 'Frozen bar',
    category: 'pad',
    description:
      'One moment from the middle of whatever is loaded, held as a chord while earlier moments drift back in the hall.',
    instrument: { deviceId: 'grain-synth', preset: 'Frozen moment', params: { volume: -19.5 } },
    effects: [
      { deviceId: 'echo-memory', preset: 'Remembering', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // guitar
  {
    id: 'broadcast-hall-guitar-and-spring',
    name: 'Guitar and spring',
    category: 'plucked',
    description:
      'A clean neck pickup played softly through an amp tremolo into a two-spring tank that drips, recorded to tape.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.35, tone: 2800, warmth: 0.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 4, depth: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { drip: 0.55, mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'broadcast-hall-backwards-answer',
    name: 'Backwards answer',
    category: 'plucked',
    description:
      'A guitar faded in with no pick to be heard, then answered backwards a second and a half later, in the hall.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { volume: 6 } },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { makeup: 12, mix: 0.7 } },
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // handpan
  {
    id: 'broadcast-hall-damped-tongue-drum',
    name: 'Damped tongue drum',
    category: 'bell',
    description:
      'A steel tongue drum set down on a rug so it sounds short and round, on tape in a small dark room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 3, damp: 0.5, volume: -5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-steel-pan-echo',
    name: 'Steel pan echo',
    category: 'bell',
    description:
      'A hand-played steel pan into a dotted tape echo and a long spring: a few notes become a slow pattern.',
    instrument: { deviceId: 'handpan', preset: 'Soft hands', params: { volume: -2.5 } },
    effects: [
      { deviceId: 'tape-echo', params: { time: 375, feedback: 0.55, heads: 3, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.2 } },
    ],
  },

  // harp
  {
    id: 'broadcast-hall-distant-hall-harp',
    name: 'Distant hall harp',
    category: 'plucked',
    description:
      'A concert harp plucked softly at the far side of the hall, the other strings sounding after each note.',
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { touch: 0.3, volume: -2 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { preDelay: 70, mix: 0.45 } }],
  },
  {
    id: 'broadcast-hall-damped-harp-repeats',
    name: 'Damped harp repeats',
    category: 'plucked',
    description:
      'Harp strings stopped with the hand, short and woody, with dark bucket-brigade repeats and a small plate.',
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { volume: -2 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.5, mix: 0.35 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // horns
  {
    id: 'broadcast-hall-stairwell-trumpet',
    name: 'Stairwell trumpet',
    category: 'wind',
    description:
      'One trumpet played softly and breathily somewhere up the stairwell, with a tape repeat and a lot of room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { type: 2, blow: 0.3, vibrato: 0.2, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 520, feedback: 0.4, mix: 0.25 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { preDelay: 80, mix: 0.5 } },
    ],
  },
  {
    id: 'broadcast-hall-low-brass-chorale',
    name: 'Low brass chorale',
    category: 'wind',
    description:
      'A section of low brass on every key, a second and a half to speak, played quietly onto tape in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 1.5, release: 3, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // modal-bells
  {
    id: 'broadcast-hall-wet-finger-glass',
    name: 'Wet finger glass',
    category: 'bell',
    description:
      'Glass rims rubbed with a wet finger: soft pure tones that sing while held and beat slowly, on tape in a long plate.',
    instrument: { deviceId: 'modal-bells', preset: 'Glass harp', params: { volume: -11 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.1 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'broadcast-hall-piano-lid-music-box',
    name: 'Piano-lid music box',
    category: 'bell',
    description:
      'A music box set on the piano lid so that the strings underneath answer its comb, over tape hiss.',
    instrument: { deviceId: 'modal-bells', preset: 'Music box', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { root: 2, mode: 1, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // outdoors
  {
    id: 'broadcast-hall-open-window-river',
    name: 'Open window river',
    category: 'texture',
    description:
      'Slow water moving past the open control-room window, a little way off, with the room around it.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.6, distance: 0.6, tone: 0.4, volume: -1 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 80, highCut: 6000 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'broadcast-hall-courtyard-blackbird',
    name: 'Courtyard blackbird',
    category: 'texture',
    description:
      'A single blackbird in the yard outside the hall, caught by the room microphones and left on the tape.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'One blackbird',
      params: { distance: 0.35, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // pedal-steel
  {
    id: 'broadcast-hall-still-steel-reel',
    name: 'Still steel reel',
    category: 'plucked',
    description:
      'A steel guitar with no vibrato, each note swelled in by the pedal and left long, on tape in a three-spring tank.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-slide-and-echo',
    name: 'Slide and echo',
    category: 'plucked',
    description:
      'A slow steel line that bends from note to note under the bar, with tape repeats and a small plate.',
    instrument: { deviceId: 'pedal-steel', preset: 'Slow steel', params: { volume: -2.5 } },
    effects: [
      { deviceId: 'tape-echo', params: { time: 480, feedback: 0.5, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // sampler: plays whatever is loaded
  {
    id: 'broadcast-hall-evening-broadcast',
    name: 'Evening broadcast',
    category: 'pad',
    description:
      'Whatever is loaded, as it would come out of a small medium-wave set in the kitchen: narrow, steady, a little static.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { attack: 0.3, release: 1.5, volume: -17 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'broadcast-hall-octave-down-bed',
    name: 'Octave-down bed',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down with a soft start, wavering under three tape heads in the hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1, release: 3.5, volume: -17.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // string-machine
  {
    id: 'broadcast-hall-string-ensemble-keys',
    name: 'String ensemble keys',
    category: 'string',
    description:
      'A seventies string ensemble through a slow phaser and a spring: thin and slowly swirling.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 0.3, release: 1.5, tone: 2800, volume: -6.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-ensemble-cellos',
    name: 'Ensemble cellos',
    category: 'string',
    description:
      'The low octave of the string ensemble alone, dark and slow to speak, through a warm amplifier a few steps from the microphone, in the hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.4, release: 3.5, tone: 1000, speed: 0.6, volume: -7.4 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { bass: 0.3, treble: -0.3, distance: 0.4, room: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // tanpura
  {
    id: 'broadcast-hall-plain-string-drone',
    name: 'Plain string drone',
    category: 'drone',
    description:
      'Open strings plucked round and round with no buzz at the bridge: a plain drone behind the piano, on tape.',
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { volume: -6 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-buzzing-bridge-reel',
    name: 'Buzzing bridge reel',
    category: 'drone',
    description:
      'A drone lute whose strings graze the bridge, each pluck opening into overtones, on a reel in a long plate.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.7, speed: 6, volume: -4 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // thesis
  {
    id: 'broadcast-hall-air-in-pipes',
    name: 'Air in pipes',
    category: 'pad',
    description:
      'Tuned bands of noise like wind in organ pipes before they speak, breathing slowly, in the hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 60, attack: 1.2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 4.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'broadcast-hall-brushed-air-chord',
    name: 'Brushed air chord',
    category: 'plucked',
    description:
      'Each key strums a spread of tuned noise bands, like a brush drawn across strings, into two slow tape heads and a long plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { scale: 4, root: 2, release: 1.5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: -0.7 } },
      { deviceId: 'tape-echo', params: { time: 640, feedback: 0.45, heads: 1, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },

  // wavetable
  {
    id: 'broadcast-hall-reed-table-pad',
    name: 'Reed table pad',
    category: 'pad',
    description:
      'A wave that drifts from reed towards sawtooth and back while it is held, slow to speak, on a wavering reel in a three-spring tank.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.4,
        motion: 0.8,
        rate: 0.06,
        detune: 10,
        sub: 0.25,
        cutoff: 2000,
        attack: 1,
        release: 3.5,
        volume: -15.7,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'broadcast-hall-hollow-slow-pad',
    name: 'Hollow slow pad',
    category: 'pad',
    description:
      'A hollow wave drifting through its table, slow to arrive, with three tape heads behind it in a plain hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 2.5, volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.35 } },
    ],
  },

  // west-coast
  {
    id: 'broadcast-hall-wood-pulse-echo',
    name: 'Wood pulse echo',
    category: 'plucked',
    description:
      'A woody synthesiser pluck that darkens as it fades, through a small amplifier close by, into two tape heads and a short room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.45, timbreEnv: 0.55, attack: 0.005, decay: 0.9, chance: 0.25, volume: 0 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.6, distance: 0.2, room: 0.3 },
      },
      { deviceId: 'tape-echo', params: { time: 300, feedback: 0.5, heads: 1, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'broadcast-hall-soft-mallet-voice',
    name: 'Soft mallet voice',
    category: 'bell',
    description:
      'A nearly pure tone struck through a gate that closes like a soft mallet leaving a bar, with dark repeats in a room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 2, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 470, feedback: 0.5, modDepth: 0.45, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // zither
  {
    id: 'broadcast-hall-struck-open-strings',
    name: 'Struck open strings',
    category: 'plucked',
    description:
      'Single strings struck with a soft hammer, like a piano with its case taken away, on tape in the wooden room.',
    instrument: { deviceId: 'zither', preset: 'Single felt string', params: { volume: -8.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'broadcast-hall-zither-strum-reel',
    name: 'Zither strum reel',
    category: 'plucked',
    description:
      'A slow pick across a note, its fifth and its octave on open strings, the others humming behind, on tape with a spring tank.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 200, brightness: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
  },
]
