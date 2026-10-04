// The packs: a hundred presets each, across every instrument, that share one
// idea of sound. What is here is only their names, so a host can list them
// with the rest of the bank; the presets themselves are a module of their own
// (./all), fetched the first time someone asks for them. A pack's sounds to
// paint with are fetched the same way (../sound-packs).

import { type FactoryPack, type FactoryPreset } from '../types'

/** How many presets a pack holds. */
export const FACTORY_PACK_SIZE = 100

/** How many sounds a pack holds, once they are written. */
export const FACTORY_SOUND_PACK_SIZE = 100

/**
 * The packs whose sounds are written (../sound-packs/<pack id>.ts holds a
 * hundred): what a host can know before it fetches any of them.
 */
const WITH_SOUNDS: ReadonlySet<string> = new Set<string>([])

const PACKS: readonly Omit<FactoryPack, 'sounds'>[] = [
  {
    id: 'concourse',
    name: 'Empty Concourse',
    description:
      'Piano notes, glassy bells and sung vowels on loops of unequal length that never meet the same way twice: music for the hours between flights.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'soft-pedal',
    name: 'Soft Pedal',
    description:
      'A piano played with the soft pedal down and left to hang in a very long, slightly detuned room. Few notes, slow, with the lid nearly closed.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'slow-brass',
    name: 'Austin Slow Brass',
    description:
      'Horns and strings that take half a minute to arrive and longer to leave, made by two patient people with guitars: no beat, no hurry, one chord.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'oxide',
    name: 'Shedding Oxide',
    description:
      'Short orchestral loops on tape so old it sheds a little more each time round, until the tune is mostly the gaps.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'nature-film',
    name: 'Faded Nature Film',
    description:
      'Detuned synthesizers off a wobbling reel, as heard under a 1970s wildlife documentary in a Scottish classroom.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'lucid',
    name: 'Cornish Lucid Dreams',
    description:
      'Pads and bells remembered from sleep on the far south-west coast of England: soft, dark, a little out of tune and oddly moving.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'static-cathedral',
    name: 'Static Cathedral',
    description:
      'Organ, piano and guitar pushed through broken digital gear until the church fills with warm static. Loud things made distant.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'four-track',
    name: 'Coast Fog Four-Track',
    description:
      'A voice, a guitar and an old electric piano recorded to cassette by the Pacific, with the reverb up until the words are gone.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'window-garden',
    name: 'Museum Window Garden',
    description:
      'A few bright notes on an electric piano, with water and birds outside: Japanese environmental music of the early eighties, written for a room with a view of trees.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'rosewood',
    name: 'Rosewood Circles',
    description:
      'Marimba patterns that turn slowly round each other, with gongs and bowls between: percussion minimalism from Tokyo, played with soft mallets.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'park-zither',
    name: 'Park Bench Zither',
    description:
      'An open-tuned zither struck with hammers and brushed by hand through a phaser and an echo, bright as a laugh, first heard busking in a New York park.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'sonoran',
    name: 'Sonoran Night Air',
    description:
      'Analogue pads that breathe as slowly as a sleeper, over the Arizona desert after dark. Open sky, long reverb, an hour without an edge.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'polar-signal',
    name: 'Polar Night Signal',
    description:
      'Cold loops and far-off radio from above the Arctic Circle: a town in the dark for two months, snow, a foghorn, a signal fading in and out.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'forest-pulse',
    name: 'Pulse under the Forest',
    description:
      "Old orchestral strings looped and blurred into fog between the trees near Cologne, with a kick drum's heartbeat somewhere far below.",
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'far-north',
    name: 'Far North Bowed Guitar',
    description:
      'An electric guitar played with a cello bow, a falsetto, a pump organ and a glockenspiel, rising very slowly over an island of lava and moss.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'orbit-steel',
    name: 'Steel in Slow Orbit',
    description:
      'Pedal steel that slides instead of twangs, and guitars with all the attack taken off: country instruments sent up to circle the moon.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'broadcast-hall',
    name: 'Old Broadcast Hall',
    description:
      'A felt-damped upright with its mechanism in the microphone, a chorus polysynth and a tape echo, in a wooden radio hall by the river in Berlin.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'laptop-guitar',
    name: 'Sunburnt Laptop Guitar',
    description:
      'A guitar fed through a laptop until the chords melt into grain and glitter: beach pop remembered through a broken summer in Vienna.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'patch-cables',
    name: 'Island Patch Cables',
    description:
      'A voltage-controlled synthesizer with no keyboard habits, woodwinds and a voice folded into it: bubbling, bright and green, from an island in the Pacific Northwest.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'ashram',
    name: 'Ashram Harp and Organ',
    description:
      'Harp glissandi, a swirling organ, a drone of strings and tanpura: spiritual jazz that left the clubs for an ashram in California.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'sequencer-1974',
    name: 'Berlin Sequencer, 1974',
    description:
      'A bass sequence running through the night under tape-replay flutes and choirs, phased strings and an organ, in West Berlin in the mid seventies.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'neon-rain',
    name: 'Neon Rain, 2019',
    description:
      'Brass swells from a huge polysynth, electric piano through chorus and a digital hall the size of a city: Los Angeles in the rain, as 1982 imagined it.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'six-squared',
    name: 'Six Squared',
    description:
      'Short sad synth loops layered until they glow, pressed hard into hiss and left in a long dark reverb: night music from England with rave in its memory.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'reel-room',
    name: 'Indiana Reel Room',
    description:
      'Slow orchestral swells run through tape until they blur, over a drone low enough to feel: steep darkness, hiss and fades that take minutes.',
    count: FACTORY_PACK_SIZE,
  },
  {
    id: 'stairwell-choir',
    name: 'Stairwell Choir of One',
    description:
      'One voice sung into a looper again and again until it is a choir, in the kind of reverb a stairwell or a church gives you for nothing.',
    count: FACTORY_PACK_SIZE,
  },
]

export const FACTORY_PACKS: readonly FactoryPack[] = PACKS.map((pack) => ({
  ...pack,
  sounds: WITH_SOUNDS.has(pack.id) ? FACTORY_SOUND_PACK_SIZE : 0,
}))

export function factoryPack(id: string): FactoryPack | undefined {
  return FACTORY_PACKS.find((pack) => pack.id === id)
}

let loading: Promise<readonly FactoryPreset[]> | undefined

/**
 * Every preset of every pack, in the order of `FACTORY_PACKS`, each with the
 * `pack` it belongs to. They are fetched once, on the first call, as one
 * module apart from the rest of the library: a bundler keeps them out of the
 * script a page starts with. A fetch that fails is tried again by the next
 * call.
 */
export function loadFactoryPacks(): Promise<readonly FactoryPreset[]> {
  // eslint-disable-next-line no-restricted-syntax -- a chunk of its own on purpose: thousands of presets no page should start with
  loading ??= import('./all').then(
    (module) => module.PACK_PRESETS,
    (failure: unknown) => {
      // A fetch that failed is tried again by the next call.
      loading = undefined
      throw failure
    },
  )
  return loading
}
