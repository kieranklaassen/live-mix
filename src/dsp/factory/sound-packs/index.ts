// The packs' sounds: a hundred to paint with for each pack, its own presets
// played. Like the presets they are thousands of entries no page should start
// with, so they are a module of their own (./all), fetched the first time
// someone asks for them. Which packs have sounds, and how many, is known
// before that: `FACTORY_PACKS` says so (`sounds`).

import { type FactorySound } from '../types'

let loading: Promise<readonly FactorySound[]> | undefined

/**
 * Every sound of every pack, in the order of `FACTORY_PACKS`, each with the
 * `pack` it belongs to and its patch written out, so `renderFactorySound` and
 * `transposeFactorySound` take one as they take a sound of the bank. They are
 * fetched once, on the first call, as one module apart from the rest of the
 * library. A fetch that fails is tried again by the next call.
 */
export function loadFactoryPackSounds(): Promise<readonly FactorySound[]> {
  // eslint-disable-next-line no-restricted-syntax -- a chunk of its own on purpose: thousands of sounds no page should start with
  loading ??= import('./all').then(
    (module) => module.PACK_SOUNDS,
    (failure: unknown) => {
      // A fetch that failed is tried again by the next call.
      loading = undefined
      throw failure
    },
  )
  return loading
}
