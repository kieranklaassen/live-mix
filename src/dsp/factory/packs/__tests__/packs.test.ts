// The packs as a whole: how they are listed, that they are fetched apart from
// the rest of the bank, and that across the bank and every pack no id, no
// name and no sound comes twice. Each pack's own presets are held to the
// limits in its own file beside this one (support.ts).

import { describe, expect, it } from 'vitest'

import { FACTORY_CHAINS } from '../../chains'
import { FACTORY_PRESETS } from '../../presets'
import { setPresets } from '../../sets/set'
import { PACK_PRESETS } from '../all'
import {
  FACTORY_PACKS,
  FACTORY_PACK_SIZE,
  FACTORY_SET_SIZE,
  factoryPack,
  loadFactoryPacks,
} from '../index'
import { SETS } from '../shelves/instruments'
import { repeatedSettings } from './support'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** What comes more than once in a list. */
function repeated(values: readonly string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => (seen.has(value) ? true : (seen.add(value), false)))
}

describe('packs', () => {
  it('are listed with a name, a line on what they are and how many they hold', () => {
    expect(FACTORY_PACKS.length).toBeGreaterThan(0)
    expect(repeated(FACTORY_PACKS.map((pack) => pack.id))).toEqual([])
    expect(repeated(FACTORY_PACKS.map((pack) => pack.name))).toEqual([])
    for (const pack of FACTORY_PACKS) {
      expect(pack.id).toMatch(KEBAB)
      expect(pack.name.length, pack.id).toBeLessThanOrEqual(24)
      expect(pack.description, pack.id).toMatch(/^[A-Z].{40,200}\.$/)
      expect(pack.count, pack.id).toBe(
        pack.shelf === 'instruments' ? FACTORY_SET_SIZE : FACTORY_PACK_SIZE,
      )
      expect(factoryPack(pack.id)).toBe(pack)
    }
    expect(factoryPack('no-such-pack')).toBeUndefined()
  })

  it('load once, every preset stamped with its pack, in the order of the list', async () => {
    const presets = await loadFactoryPacks()
    expect(presets).toEqual(PACK_PRESETS)
    expect(await loadFactoryPacks()).toBe(presets)
    expect(presets).toHaveLength(FACTORY_PACKS.reduce((sum, pack) => sum + pack.count, 0))
    const order = FACTORY_PACKS.map((pack) => pack.id)
    expect([...new Set(presets.map((preset) => preset.pack))]).toEqual(order)
    for (const preset of FACTORY_PRESETS) expect(preset.pack, preset.id).toBeUndefined()
  })

  it('list each set as its table is', () => {
    expect(SETS.map((set) => set.device)).toEqual(
      FACTORY_PACKS.flatMap((pack) => pack.instrument ?? []),
    )
    for (const set of SETS) {
      const presets = setPresets(set)
      const directions = set.directions.map(({ name }) => ({
        name,
        count: presets.filter((preset) => preset.direction === name).length,
      }))
      expect(factoryPack(`${set.device}-set`), set.device).toMatchObject({
        shelf: 'instruments',
        count: presets.length,
        directions,
      })
    }
  })

  it('share no id, no name and no sound with each other or the bank', () => {
    const presets = [...FACTORY_PRESETS, ...PACK_PRESETS]
    expect(repeated([...presets, ...FACTORY_CHAINS].map((patch) => patch.id))).toEqual([])
    expect(repeated(presets.map((preset) => preset.name.toLowerCase()))).toEqual([])
    expect(repeatedSettings(presets), 'presets set exactly like another').toEqual([])
  })
})
