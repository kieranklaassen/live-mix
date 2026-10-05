// Every pack's chains in one list, each stamped with its pack. Nothing but
// ./index's `loadFactoryPackChains` (and the tests) imports this module, so it
// stays a chunk of its own: it holds data alone and imports nothing but the
// packs' own files.

import { type FactoryChain } from '../types'
import { CHAINS as OXIDE } from './oxide'

const stamped = (pack: string, chains: readonly FactoryChain[]): FactoryChain[] =>
  chains.map((chain) => ({ ...chain, pack }))

/** In the order of `FACTORY_PACKS`. */
const BY_PACK: readonly (readonly [string, readonly FactoryChain[]])[] = [['oxide', OXIDE]]

export const PACK_CHAINS: readonly FactoryChain[] = BY_PACK.flatMap(([pack, chains]) =>
  stamped(pack, chains),
)
