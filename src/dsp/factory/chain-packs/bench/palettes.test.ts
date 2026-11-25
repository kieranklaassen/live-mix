// Every pack has a palette and every palette holds its form (./palette-check.ts):
// its groups add up, what it leans on exists in the lexicon, its own recipes
// can be read, and its words are words a name can be made of.

import { describe, expect, it } from 'vitest'

import { FACTORY_PACKS } from '../../packs'
import { paletteProblems } from './palette-check'
import { PALETTES } from './palettes'

describe('chain bench: the palettes', () => {
  it("are one to a pack that has chains, in the packs' order", () => {
    const packs = FACTORY_PACKS.filter((pack) => pack.chains > 0)
    expect(PALETTES.map((palette) => palette.pack)).toEqual(packs.map((pack) => pack.id))
  })

  it.each(PALETTES.map((palette) => [palette.pack, palette] as const))(
    '%s holds its form',
    (_pack, palette) => {
      expect(paletteProblems(palette)).toEqual([])
    },
  )
})
