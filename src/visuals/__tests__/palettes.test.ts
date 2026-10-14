import { describe, expect, it } from 'vitest'

import { DEFAULT_PALETTE, VISUAL_PALETTES, isVisualPalette, visualPalette } from '../palettes'

describe('the palettes', () => {
  it('has sixteen palettes', () => {
    expect(VISUAL_PALETTES).toHaveLength(16)
  })

  it('gives each palette an id of its own, in lowercase with dashes, and a name of its own', () => {
    const ids = VISUAL_PALETTES.map((palette) => palette.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]{0,39}$/)
    const names = VISUAL_PALETTES.map((palette) => palette.name.trim().toLowerCase())
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) expect(name).not.toBe('')
  })

  it('keeps every number between nothing and one', () => {
    for (const palette of VISUAL_PALETTES) {
      for (const value of [palette.calm, palette.pull, palette.arcMid, palette.arcWide]) {
        expect(Number.isFinite(value), palette.id).toBe(true)
        expect(value, palette.id).toBeGreaterThanOrEqual(0)
        expect(value, palette.id).toBeLessThanOrEqual(1)
      }
    }
  })

  it('has the palette a piece starts with', () => {
    expect(isVisualPalette(DEFAULT_PALETTE)).toBe(true)
    expect(visualPalette(DEFAULT_PALETTE).id).toBe(DEFAULT_PALETTE)
    expect(VISUAL_PALETTES).toContain(visualPalette(DEFAULT_PALETTE))
  })

  it('finds a palette by its id', () => {
    for (const palette of VISUAL_PALETTES) {
      expect(visualPalette(palette.id)).toBe(palette)
      expect(isVisualPalette(palette.id)).toBe(true)
    }
  })

  it('falls back to the first palette of a piece for an id it does not have', () => {
    expect(visualPalette('no-such-palette')).toBe(visualPalette(DEFAULT_PALETTE))
    expect(visualPalette('')).toBe(visualPalette(DEFAULT_PALETTE))
    expect(isVisualPalette('no-such-palette')).toBe(false)
    expect(isVisualPalette('')).toBe(false)
  })
})
