import { type FactoryPreset } from '../types'

export const OVERTONE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'throat-song-hall',
    name: 'Throat song hall',
    category: 'voice',
    description:
      'A pressed voice whose whistle walks over each note of the line, sung into a hall.',
    instrument: { deviceId: 'overtone', preset: 'Throat song' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'still-whistle-plate',
    name: 'Still whistle plate',
    category: 'voice',
    description: 'One clear harmonic held without moving over its note, on a medium plate.',
    instrument: { deviceId: 'overtone', preset: 'Still whistle', params: { volume: -6 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
    preview: 'hold',
  },
  {
    id: 'growl-in-the-cave',
    name: 'Growl in the cave',
    category: 'drone',
    description:
      'A low fifth with a rattle an octave under it and a slow whistle above, in a dark cave.',
    instrument: { deviceId: 'overtone', preset: 'Low growl', params: { volume: -12 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
  },
  {
    id: 'drone-pipe-valley',
    name: 'Drone pipe valley',
    category: 'drone',
    description:
      'A long wooden pipe with buzzing lips, its hollow overtones carried across an open valley.',
    instrument: { deviceId: 'overtone', preset: 'Drone pipe', params: { volume: -9.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'jaw-harp-echoes',
    name: 'Jaw harp echoes',
    category: 'voice',
    description:
      'A twanging reed whose mouth steps quickly through the harmonics, bounced by a tape echo in a room.',
    instrument: { deviceId: 'overtone', preset: 'Jaw harp', params: { volume: -6.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  {
    id: 'slow-chant-nave',
    name: 'Slow chant nave',
    category: 'voice',
    description:
      'Two voices swell in slowly and their whistles move together now and then, far down a vast nave.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { volume: -11, attack: 0.8, pace: 0.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } }],
    preview: 'low',
  },
  {
    id: 'breath-pipe-on-tape',
    name: 'Breath pipe on tape',
    category: 'drone',
    description:
      'A pipe blown with nearly as much air as tone, recorded to worn tape and left on a small plate.',
    instrument: { deviceId: 'overtone', preset: 'Breath pipe' },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'whistle-shimmer',
    name: 'Whistle shimmer',
    category: 'voice',
    description: 'A high whistle over one held note, its tail lifted an octave by a faint shimmer.',
    instrument: { deviceId: 'overtone', preset: 'High whistle' },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } }],
    preview: 'hold',
  },
  {
    id: 'open-vowel-choir',
    name: 'Open vowel choir',
    category: 'voice',
    description:
      'A broad mouth sliding from vowel to vowel on a sung line, thickened by an ensemble chorus in a room.',
    instrument: { deviceId: 'overtone', preset: 'Open vowels', params: { volume: -5, pace: 0.8 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'reed-drone-swirl',
    name: 'Reed drone swirl',
    category: 'drone',
    description: 'A lean bright reed drone turned slowly by a phaser, with a hall behind it.',
    instrument: { deviceId: 'overtone', preset: 'Reed drone', params: { volume: -7 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'quick-steps-close',
    name: 'Quick steps close',
    category: 'voice',
    description:
      'A whistle skipping from harmonic to harmonic three times a second, close and nearly dry.',
    instrument: { deviceId: 'overtone', preset: 'Quick steps' },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } }],
    preview: 'line',
  },
  {
    id: 'deep-chant-vowels',
    name: 'Deep chant vowels',
    category: 'drone',
    description:
      'A rough low chant on its fourth harmonic, answered by a reverb that sings in low vowels.',
    instrument: { deviceId: 'overtone', preset: 'Deep chant', params: { volume: -11.5 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.3 } }],
  },
  {
    id: 'air-whistle-mist',
    name: 'Air whistle mist',
    category: 'voice',
    description:
      'Nearly as much breath as tone, whistling at one harmonic after another, smeared into a hanging mist.',
    instrument: { deviceId: 'overtone', preset: 'Air whistle', params: { volume: -10.5 } },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.5 } }],
    preview: 'hold',
  },
  {
    id: 'wide-chord-halo',
    name: 'Wide chord halo',
    category: 'voice',
    description:
      'Two wavering voices standing apart, their whistles drifting wide through a detuned halo in a hall.',
    instrument: { deviceId: 'overtone', preset: 'Wide chord', params: { volume: -10 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'lip-buzz-speaker',
    name: 'Lip buzz speaker',
    category: 'drone',
    description:
      'Buzzing lips on a pipe, all rattle and third harmonic, through a small combo amplifier in a room.',
    instrument: { deviceId: 'overtone', preset: 'Lip buzz', params: { volume: -10.5 } },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
  },
  {
    id: 'glass-harmonic-rain',
    name: 'Glass harmonic rain',
    category: 'voice',
    description:
      'A glassy high harmonic of a reed rising slowly, scattered into high grains over a long plate.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { volume: -6.5, attack: 0.6 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'hold',
  },
  {
    id: 'throat-song-loop',
    name: 'Throat song loop',
    category: 'voice',
    description:
      'A throat song whose whistle walks far and often, laid over itself by a slowly fading tape loop.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: { wander: 0.9, pace: 1.4, focus: 0.9 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.4 } }],
    preview: 'line',
  },
  {
    id: 'turning-pipe',
    name: 'Turning pipe',
    category: 'drone',
    description:
      'A drone pipe held on its ninth harmonic through a slow rotating speaker, in a small room.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { overtone: 9, wander: 0, focus: 0.7, growl: 0.15 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'whistle-recalled',
    name: 'Whistle recalled',
    category: 'voice',
    description:
      'A clean whistle stepping over a sung line while an echo brings back what it sang a while ago.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { wander: 0.6, pace: 1.5, overtone: 8 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.35 } }],
    preview: 'line',
  },
  {
    id: 'driven-growl',
    name: 'Driven growl',
    category: 'drone',
    description: 'The low growl pushed through a glowing valve stage into a dark amplifier spring.',
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { volume: -10.5, growl: 1, focus: 0.45 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25 } },
    ],
  },
]
