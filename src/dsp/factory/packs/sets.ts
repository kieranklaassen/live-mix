// The sets: five hundred presets of one instrument each, in ten directions of
// fifty, listed as a pack so that everything that reads packs reads them. Their
// tables (../sets) are fetched with the other packs (./index); this is what a
// host can know before. A test holds it to the tables (./__tests__/packs.test.ts).

import { setId } from '../sets/set'
import { type FactoryPack } from '../types'

/** How many presets a set holds. */
export const FACTORY_SET_SIZE = 500

interface Set_ {
  device: string
  name: string
  description: string
  directions: readonly string[]
}

const SETS: readonly Set_[] = [
  {
    device: 'slow-accord',
    name: 'Slow Accord',
    description:
      'Strange metal that settles overtone by overtone into the chord you hold: bells, organs, dawns, squeezed basses and swinging choirs.',
    directions: [
      'Bell becomes organ',
      'Scattered dawn',
      'Half bent keys',
      'Squeezed bass',
      'Never resting',
      'Stepped glass',
      'Halo of the bass',
      'Quick pluck',
      'Swinging choir',
      'Raw metal',
    ],
  },
  {
    device: 'chord-clock',
    name: 'Chord Clock',
    description:
      "Pulses that quicken into tones and leave a chord's own polyrhythm circling: pads, counters, engines, octave stairs and looms.",
    directions: [
      'Pattering pads',
      'Wooden counters',
      'Breath engines',
      'Counting basses',
      'Agreeing bells',
      'Octave stairs',
      'Grain drones',
      'Winding choirs',
      'Seven-limit looms',
      'Solitary pulses',
    ],
  },
  {
    device: 'setting-glass',
    name: 'Setting Glass',
    description:
      'Molten chords that clear from the top down as they cool: dawns, quenched keys, salt drones, shattered bells and obsidian.',
    directions: [
      'Crystal dawn',
      'Quenched keys',
      'Molten bass',
      'Salt drones',
      'Shattered bells',
      'Pouring textures',
      'Remelting swells',
      'Sugar plucks',
      'Obsidian voices',
      'Frozen and let go',
    ],
  },
  {
    device: 'wire-lantern',
    name: 'Wire Lantern',
    description:
      'Wire strung on the edges of a solid and turned past the ears: open harps, handmade bells, rings, blown corners and muted ones.',
    directions: [
      'Open harps',
      'Handmade bells',
      'Turning pads',
      'Rings, plucked and bowed',
      'Blown corners',
      'Low wires',
      'Web and dust',
      'Glass keys',
      'Drones in the frame',
      'Muted corners',
    ],
  },
  {
    device: 'singing-sand',
    name: 'Singing Sand',
    description:
      'Grains that fall into step until a slope sings: dune pads, squeaking keys, glass beaches, aftershocks and far rain.',
    directions: [
      'Dune pads',
      'Bass slopes',
      'Squeaking keys',
      'Glass beach bells',
      'Dissolving voices',
      'Aftershocks',
      'Locked drones',
      'Cluster organs',
      'Flint plucks',
      'Far rain',
    ],
  },
]

const IN_A_DIRECTION = 50

export const SET_PACKS: readonly FactoryPack[] = SETS.map(
  ({ device, name, description, directions }): FactoryPack => ({
    id: setId(device),
    name,
    description,
    shelf: 'instruments',
    count: FACTORY_SET_SIZE,
    instrument: device,
    directions: directions.map((direction) => ({ name: direction, count: IN_A_DIRECTION })),
    sounds: 0,
    chains: 0,
  }),
)
