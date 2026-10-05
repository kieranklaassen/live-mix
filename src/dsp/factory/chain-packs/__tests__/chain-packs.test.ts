// The packs' chains as a whole: that they are fetched apart from the rest of
// the bank, that each is stamped with its pack, and that across the bank and
// every pack no id, no name and no chain comes twice. Each pack's own chains
// are held to the limits in its own file beside this one (support.ts).

import { describe, expect, it } from 'vitest'

import { FACTORY_CHAINS } from '../../chains'
import { FACTORY_CHAIN_PACK_SIZE, FACTORY_PACKS } from '../../packs'
import { PACK_PRESETS } from '../../packs/all'
import { patchSettings } from '../../packs/__tests__/support'
import { FACTORY_PRESETS } from '../../presets'
import { PACK_SOUNDS } from '../../sound-packs/all'
import { FACTORY_SOUNDS } from '../../sounds'
import { PACK_CHAINS } from '../all'
import { loadFactoryPackChains } from '../index'
import { chainSignature } from './support'

/** What comes more than once in a list. */
function repeated(values: readonly string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => (seen.has(value) ? true : (seen.add(value), false)))
}

describe('pack chains', () => {
  it('load once, every chain stamped with its pack, in the order of the packs', async () => {
    const chains = await loadFactoryPackChains()
    expect(chains).toBe(PACK_CHAINS)
    expect(await loadFactoryPackChains()).toBe(chains)
    const order = FACTORY_PACKS.filter((pack) => pack.chains > 0).map((pack) => pack.id)
    expect([...new Set(chains.map((chain) => chain.pack))]).toEqual(order)
    for (const chain of FACTORY_CHAINS) expect(chain.pack, chain.id).toBeUndefined()
  })

  it('are a hundred to a pack or none, as the list of packs says', () => {
    for (const pack of FACTORY_PACKS) {
      const count = PACK_CHAINS.filter((chain) => chain.pack === pack.id).length
      expect(count, pack.id).toBe(pack.chains)
      expect([0, FACTORY_CHAIN_PACK_SIZE], pack.id).toContain(count)
    }
  })

  it('share no id with anything in the bank or the packs, and no name with another chain', () => {
    const others = [...FACTORY_PRESETS, ...PACK_PRESETS, ...FACTORY_SOUNDS, ...PACK_SOUNDS]
    const chains = [...FACTORY_CHAINS, ...PACK_CHAINS]
    expect(repeated([...chains, ...others].map((entry) => entry.id))).toEqual([])
    expect(repeated(chains.map((chain) => chain.name.toLowerCase()))).toEqual([])
  })

  it('are no chain twice: not the same effects on the same presets, not the same settings', () => {
    expect(repeated(PACK_CHAINS.map(chainSignature)), 'effects and presets').toEqual([])
    expect(
      repeated([...FACTORY_CHAINS, ...PACK_CHAINS].map((chain) => patchSettings(chain))),
      'settings',
    ).toEqual([])
  })
})
