// The packs' effect chains: a hundred for each pack, in the pack's own idea
// of sound, for any channel. Like the presets and the sounds they are
// thousands of entries no page should start with, so they are a module of
// their own (./all), fetched the first time someone asks for them. Which
// packs have chains, and how many, is known before that: `FACTORY_PACKS`
// says so (`chains`).

import { type FactoryChain } from '../types'

let loading: Promise<readonly FactoryChain[]> | undefined

/**
 * Every chain of every pack, in the order of `FACTORY_PACKS`, each with the
 * `pack` it belongs to. A pack chain is an ordinary `FactoryChain`:
 * `renderChainPreview`, `patchEffectOps` and `loadPatch` take it as they take
 * a chain of the bank. They are fetched once, on the first call, as one
 * module apart from the rest of the library. A fetch that fails is tried
 * again by the next call.
 */
export function loadFactoryPackChains(): Promise<readonly FactoryChain[]> {
  // eslint-disable-next-line no-restricted-syntax -- a chunk of its own on purpose: thousands of chains no page should start with
  loading ??= import('./all').then(
    (module) => module.PACK_CHAINS,
    (failure: unknown) => {
      // A fetch that failed is tried again by the next call.
      loading = undefined
      throw failure
    },
  )
  return loading
}
