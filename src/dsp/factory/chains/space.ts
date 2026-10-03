// Space: reverbs.

import { type FactoryChain } from '../types'

export const SPACE_CHAINS: readonly FactoryChain[] = [
  {
    id: 'long-plate',
    name: 'Long plate',
    category: 'space',
    description: 'A bright steel plate with a long even tail, the plain reverb for anything.',
    effects: [{ deviceId: 'dattorro', preset: 'Long plate' }],
  },
  {
    id: 'breathing-hall',
    name: 'Breathing hall',
    category: 'space',
    description: 'A large hall whose tail rises and falls every five seconds, like slow breath.',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing' }],
  },
  {
    id: 'infinite-space',
    name: 'Infinite space',
    category: 'space',
    description: 'A modulated space with a one minute tail that swells in behind each note.',
    effects: [{ deviceId: 'expanse', preset: 'Event horizon', params: { width: 0.8 } }],
  },
  {
    id: 'frozen-room',
    name: 'Frozen room',
    category: 'space',
    description:
      'A big undamped room with a long wide tail; its freeze switch holds whatever is ringing in it.',
    effects: [
      {
        deviceId: 'ether-reverb',
        preset: 'Cathedral',
        params: { decay: 30, damping: 0.1, size: 1, mix: 0.25 },
      },
    ],
  },
  {
    id: 'spring-tank',
    name: 'Spring tank',
    category: 'space',
    description: 'Three long springs with the chirp and drip of the tank in an old amplifier.',
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } }],
  },

  {
    id: 'backwards-cloud',
    name: 'Backwards cloud',
    category: 'space',
    description:
      'Each note is answered by a cloud that grows backwards behind it and cuts off, inside a quiet plate.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'singing-hall',
    name: 'Singing hall',
    category: 'space',
    description: 'A hall whose tail holds a soft sung ah behind every note.',
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
  },
  {
    id: 'wandering-choir',
    name: 'Wandering choir',
    category: 'space',
    description: 'A choir whose vowel drifts on its own, left to dissolve in a plate.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'amp-down-the-hall',
    name: 'Amp down the hall',
    category: 'space',
    description:
      'A guitar amplifier heard from the far end of a hall, with a plate carrying the tail on.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -1.5 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'swarm-cavern',
    name: 'Swarm cavern',
    category: 'space',
    description: 'A rush of separate echoes after each note that piles up into a dark cave.',
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern' }],
  },
]
