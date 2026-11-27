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
    device: 'walking-voices',
    name: 'Walking Voices',
    description:
      'A crowd of singers that walks from chord to chord: choirs near and far, hummed and whistled, led by one voice or grounded by the basses.',
    directions: [
      'Surge hymns',
      'Perfect pools',
      'Hummed vigils',
      'Whistling fields',
      'Leaders and shadows',
      'Bass floors',
      'Gathered keys',
      'Slow glaciers',
      'Strings on foot',
      'Quarrels',
    ],
  },
  {
    device: 'unsung-voice',
    name: 'Unsung Voice',
    description:
      'The voice that appears where the overtones of held keys meet: halos, descants, crowns of bells and breath lines over warm, close chords.',
    directions: [
      'Chapel four',
      'Glass descant',
      'Plucked halo',
      'Bowed fog',
      'Bell crown',
      'Beating seconds',
      'Low partner',
      'Breath line',
      'Reed keys',
      'Dark drone',
    ],
  },
  {
    device: 'common-air',
    name: 'Common Air',
    description:
      'Reeds that share one breath, lean on each other and settle into tune: tides, mouths, lullabies, locked fifths and sleepers.',
    directions: [
      'Mountain mouth',
      'Last breath',
      'Circular drone',
      'Paper lullaby',
      'Reed bass',
      'Chiff keys',
      'Locked fifths',
      'Breath tide',
      'Steel bells',
      'Five sleepers',
    ],
  },
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
    device: 'deep-roots',
    name: 'Deep Roots',
    description:
      'Notes that grow downward until a bass appears that nobody played: rooted pads, canopies, seeds, peat drones and late foundations.',
    directions: [
      'Rooted pads',
      'Glass canopies',
      'Plucked seeds',
      'One-finger basses',
      'Chalk bells',
      'Peat drones',
      'Falling gravel',
      'Breath elders',
      'Pulsing roots',
      'Late foundations',
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
    device: 'standing-water',
    name: 'Standing Water',
    description:
      'Shaken water read along a circle: pools, ripples, striped flutes, mercury bells, films of oil and throats of water.',
    directions: [
      'Pool pads',
      'Late basses',
      'Ripple keys',
      'Stripe flutes',
      'Mercury bells',
      'Oil drones',
      'Eightfold shimmers',
      'Quarrelling swells',
      'Pin plucks',
      'Throats of water',
    ],
  },
  {
    device: 'ringing-order',
    name: 'Ringing Order',
    description:
      'Overtones that take turns like ringers in a tower: peals, melted rows, plucked canons, half muffled bells and answering sides.',
    directions: [
      'Fused pads',
      'Plain keys',
      'Canon plucks',
      'Covered bass',
      'Half muffled bells',
      'Slow hum drones',
      'Breath textures',
      'Reed voices',
      'Opposed pulses',
      'Quarter hours',
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
