// The packs' sounds as a whole: that they are fetched apart from the rest of
// the bank, that each pack counts its sounds up from a number of its own, and
// that across the bank and every pack no id, no name, no number and no recipe
// comes twice. Each pack's own sounds are held to the limits in its own file
// beside this one (support.ts).

import { describe, expect, it } from 'vitest'

import { FACTORY_CHAINS } from '../../chains'
import { FACTORY_PACKS, FACTORY_SOUND_PACK_SIZE } from '../../packs'
import { PACK_PRESETS } from '../../packs/all'
import { FACTORY_PRESETS } from '../../presets'
import { FACTORY_SOUNDS } from '../../sounds'
import { PACK_SOUNDS } from '../all'
import { loadFactoryPackSounds } from '../index'
import { soundSettings } from './support'

/** What comes more than once in a list. */
function repeated(values: readonly (string | number)[]): (string | number)[] {
  const seen = new Set<string | number>()
  return values.filter((value) => (seen.has(value) ? true : (seen.add(value), false)))
}

describe('pack sounds', () => {
  it('load once, every sound stamped with its pack, in the order of the packs', async () => {
    const sounds = await loadFactoryPackSounds()
    expect(sounds).toBe(PACK_SOUNDS)
    expect(await loadFactoryPackSounds()).toBe(sounds)
    const order = FACTORY_PACKS.filter((pack) => pack.sounds > 0).map((pack) => pack.id)
    expect([...new Set(sounds.map((sound) => sound.pack))]).toEqual(order)
    for (const sound of FACTORY_SOUNDS) expect(sound.pack, sound.id).toBeUndefined()
  })

  it('are a hundred to a pack or none, as the list of packs says', () => {
    for (const pack of FACTORY_PACKS) {
      const count = PACK_SOUNDS.filter((sound) => sound.pack === pack.id).length
      expect(count, pack.id).toBe(pack.sounds)
      expect([0, FACTORY_SOUND_PACK_SIZE], pack.id).toContain(count)
    }
  })

  it('count up from a thousand times the place of their pack, clear of the bank', () => {
    FACTORY_PACKS.forEach((pack, index) => {
      const numbers = PACK_SOUNDS.filter((sound) => sound.pack === pack.id).map(
        (sound) => sound.number,
      )
      expect(numbers, pack.id).toEqual(numbers.map((_, at) => (index + 1) * 1000 + at + 1))
    })
    expect(Math.max(...FACTORY_SOUNDS.map((sound) => sound.number))).toBeLessThan(1000)
  })

  it('share no id, no number, no name and no recipe with each other or the bank', () => {
    const sounds = [...FACTORY_SOUNDS, ...PACK_SOUNDS]
    const patches = [...FACTORY_PRESETS, ...PACK_PRESETS, ...FACTORY_CHAINS]
    expect(repeated([...sounds, ...patches].map((entry) => entry.id))).toEqual([])
    expect(repeated(sounds.map((sound) => sound.number))).toEqual([])
    expect(repeated(sounds.map((sound) => sound.name.toLowerCase()))).toEqual([])
    expect(repeated(PACK_SOUNDS.map(soundSettings)), 'recipes written twice').toEqual([])
  })
})
