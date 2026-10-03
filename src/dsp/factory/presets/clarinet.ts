import { type FactoryPreset } from '../types'

export const CLARINET_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'clarinet-in-a-room',
    name: 'Clarinet in a room',
    category: 'wind',
    description: 'A warm low clarinet, hollow and a little breathy, close up in a small room.',
    instrument: { deviceId: 'clarinet', preset: 'Warm clarinet', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'subtone-tenor-plate',
    name: 'Subtone tenor',
    category: 'wind',
    description:
      'A tenor saxophone blown so softly that it is more breath than note, on tape with a long plate.',
    instrument: { deviceId: 'clarinet', preset: 'Subtone tenor' },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'clarinets-from-nothing',
    name: 'Clarinets from nothing',
    category: 'wind',
    description:
      'A chord of clarinets that fades in from silence, air first, and leaves through a hall.',
    instrument: { deviceId: 'clarinet', preset: 'From nothing', params: { volume: -10 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'bass-clarinet-drone',
    name: 'Bass clarinet drone',
    category: 'wind',
    description:
      'The bottom of a bass clarinet, woody and slow to speak, held as a fifth in a very large space.',
    instrument: { deviceId: 'clarinet', preset: 'Bass clarinet', params: { volume: -5 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'low',
  },
  {
    id: 'soprano-tape-echo',
    name: 'Soprano into tape echo',
    category: 'wind',
    description:
      'A bright soprano saxophone line caught by a tape echo that keeps its last phrases turning.',
    instrument: { deviceId: 'clarinet', preset: 'Bright soprano', params: { volume: -4 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.65, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'close-alto-reed',
    name: 'Close alto reed',
    category: 'wind',
    description:
      'An alto saxophone at an easy medium blow with a light vibrato, close up in a small plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: {
        bore: 0.75,
        blow: 0.55,
        breath: 0.3,
        attack: 0.07,
        release: 0.35,
        vibrato: 0.3,
        volume: -3.5,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'tongued-clarinet',
    name: 'Tongued clarinet',
    category: 'wind',
    description:
      'A clarinet tongued hard so each note starts at once and stops short, nearly dry in a tight chamber.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.5, breath: 0.2, attack: 0.015, release: 0.05, volume: -8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
    preview: 'keys',
  },
  {
    id: 'humming-clarinets',
    name: 'Humming clarinets',
    category: 'pad',
    description:
      'Clarinets blown so gently that only a pure hum is left, held through a slow chorus and a dark plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.1, breath: 0.08, attack: 0.6, release: 1.5, volume: -8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'shellac-clarinet',
    name: 'Shellac clarinet',
    category: 'wind',
    description:
      'A dance band clarinet with a steady vibrato, recorded in a room and played back from a crackling 78.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.72, breath: 0.3, attack: 0.05, release: 0.25, vibrato: 0.5, volume: -4.8 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'vinyl', preset: 'Parlour 78' },
    ],
  },
  {
    id: 'flutter-tongue-reed',
    name: 'Flutter tongue reed',
    category: 'wind',
    description: 'A clarinet blown hard and flutter tongued so every note rasps, in a bright hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { bore: 0.1, blow: 0.9, attack: 0.04, vibrato: 0, growl: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -4.5 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stopped-pipe-hum',
    name: 'Stopped pipe hum',
    category: 'wind',
    description:
      'A plain soft hum with a little air under it, like blowing across a bottle, in a small room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0, breath: 1, attack: 0.06, volume: -4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room' }],
  },
  {
    id: 'reed-hum-cloud',
    name: 'Reed hum cloud',
    category: 'texture',
    description:
      'A dull hum with a flutter of breath in it that fades in slowly, broken into grains that swell and dip, in a long hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: {
        bore: 0.5,
        blow: 0,
        breath: 1,
        attack: 1.2,
        release: 2.5,
        vibrato: 0,
        growl: 0.4,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'clarinet-stop-organ',
    name: 'Clarinet stop organ',
    category: 'organ',
    description:
      'A hollow reed stop with hardly any breath, octaves added below and above, turning in a rotary speaker.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { bore: 0.2, blow: 0.8, breath: 0.05, attack: 0.03, release: 0.15, volume: -14 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'clarinet-octave-halo',
    name: 'Clarinet octave halo',
    category: 'wind',
    description:
      'A softly blown clarinet that eases in, with a reverb tail that climbs an octave on every pass.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.2, blow: 0.3, breath: 0.2, attack: 0.8, release: 2, volume: -7 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { width: 0.3 } }],
  },
  {
    id: 'hard-blown-clarinet',
    name: 'Hard blown clarinet',
    category: 'wind',
    description:
      'A clarinet blown as hard as it goes, bright and reedy with almost no breath, dry in a tight room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 1, breath: 0.1, attack: 0.03, release: 0.2, volume: -3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
  },
  {
    id: 'wavering-reed',
    name: 'Wavering reed',
    category: 'wind',
    description:
      'A soft pure reed with the widest vibrato it has, swaying like a sung note over a faint dark echo and a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: {
        bore: 0.45,
        blow: 0.25,
        breath: 0.15,
        attack: 0.3,
        release: 0.8,
        vibrato: 1,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'shortwave-clarinet',
    name: 'Shortwave clarinet',
    category: 'wind',
    description:
      'A clarinet in a hall heard over a night radio link, narrow and fading, with static that hisses on and swells after the notes stop.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { bore: 0.15, breath: 0.3, attack: 0.12, release: 0.6, vibrato: 0.25, volume: -2.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'radio', preset: 'Night shortwave', params: { static: 0.2 } },
    ],
  },
  {
    id: 'reed-foghorn',
    name: 'Reed foghorn',
    category: 'drone',
    description:
      'A low fifth blown hard through a half conical pipe, played over a loudspeaker and heard from the far end of a very large space.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: {
        bore: 0.65,
        blow: 0.9,
        breath: 0.25,
        attack: 1,
        release: 2.5,
        growl: 0.15,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Far end of the hall',
        params: { drive: 0.4, treble: 0.6, output: -3.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'baritone-reed-honk',
    name: 'Baritone reed honk',
    category: 'wind',
    description:
      'A baritone saxophone blown hard at the bottom, with a little rasp, pushed onto tape in a small room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: {
        blow: 0.9,
        breath: 0.35,
        attack: 0.03,
        release: 0.2,
        vibrato: 0.1,
        growl: 0.12,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
    preview: 'low',
  },
  {
    id: 'shawm-over-a-valley',
    name: 'Shawm over a valley',
    category: 'wind',
    description:
      'A loud conical reed pipe played outdoors, its notes coming back as separate far echoes.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { blow: 1, breath: 0.1, attack: 0.04, vibrato: 0.15, growl: 0.1, volume: -7 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 8 } },
    ],
  },
]
