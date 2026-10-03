// Texture: granular and spectral.

import { type FactoryChain } from '../types'

export const TEXTURE_CHAINS: readonly FactoryChain[] = [
  {
    id: 'soft-grain-cloud',
    name: 'Soft grain cloud',
    category: 'texture',
    description:
      'The last moments replayed as overlapping grains in a hall; its freeze holds the cloud still.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'spectral-smear',
    name: 'Spectral smear',
    category: 'texture',
    description:
      'Every frequency hangs on after its note and attacks dissolve; switch on freeze for a drone.',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.8, mix: 0.4, width: 0.7 },
      },
    ],
  },
  {
    id: 'sympathetic-strings',
    name: 'Sympathetic strings',
    category: 'texture',
    description:
      'Sixteen strings that tune themselves to the notes you play and ring on after them.',
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { strings: 12, sympathy: 0.5, decay: 6, mix: 0.3, width: 0.85 },
      },
    ],
  },
  {
    id: 'bowed-swells',
    name: 'Bowed swells',
    category: 'texture',
    description:
      'Attacks are removed so each note fades in like a bow, levelled and carried on by a plate.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'limiter-1176', params: { inputGain: 8, outputGain: -2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'scattered-drift',
    name: 'Scattered drift',
    category: 'texture',
    description:
      'Reversed grains of the last two seconds wander off pitch both ways, in a dark room.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Scatter', params: { bloom: 0.85, mix: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Small dark room',
        params: { size: 0.3, decay: 4, mix: 0.35 },
      },
    ],
  },

  {
    id: 'soft-stumbles',
    name: 'Soft stumbles',
    category: 'texture',
    description:
      'Now and then a moment repeats, turns backwards or winds down, each one faded in and blurred by a hall.',
    effects: [
      { deviceId: 'glitch', preset: 'Gentle stumble', params: { calm: 0.85, chance: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'skipping-disc',
    name: 'Skipping disc',
    category: 'texture',
    description:
      'The sound sticks on tiny fragments like a scratched disc, softened and set in a plate.',
    effects: [
      { deviceId: 'glitch', preset: 'Skipping disc', params: { calm: 0.45, mix: 0.8 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stacked-loops',
    name: 'Stacked loops',
    category: 'texture',
    description:
      'Each note comes back as little loops an octave and two octaves up, falling into a long plate.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.45 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'drawn-drone',
    name: 'Drawn drone',
    category: 'texture',
    description: 'A slowly darkening drone is drawn out of every note and carried into a hall.',
    effects: [
      { deviceId: 'cascade', preset: 'Long drone', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sideband-ghosts',
    name: 'Sideband ghosts',
    category: 'texture',
    description:
      'Every pitch shifted off its harmony on a drifting sideband set, repeated on worn tape and left in a plate.',
    effects: [
      {
        deviceId: 'radio',
        preset: 'Sideband voices',
        params: { tuning: 0.25, interference: 0.1, mix: 0.8 },
      },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { feedback: 0.45, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'section-behind',
    name: 'Section behind',
    category: 'texture',
    description:
      'A string section swells in behind each chord and follows the harmony, set in a soft plate.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'strings-above',
    name: 'Strings above',
    category: 'texture',
    description:
      'A section an octave above what you play rises slowly over it and drifts off into a hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sustain-pedal',
    name: 'Sustain pedal',
    category: 'texture',
    description:
      'Holds each note or chord as an even pad that glides to the next, with a little room around it.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'held-strings',
    name: 'Held strings',
    category: 'texture',
    description:
      'Every chord you play is caught and swells in behind you as a slow string section in a long plate.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.45 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
]
