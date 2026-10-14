/**
 * The palettes a picture can be shown in. A palette lies over every visual alike, after the visual has drawn itself in
 * the colours of the sounds: it takes the vividness down, and it can fold the whole colour wheel onto one arc of it, so
 * that every colour lands in one family and still differs from its neighbours.
 *
 * An id is saved in pieces: it is never renamed and never given other colours.
 */

export interface VisualPalette {
  id: string
  name: string
  /** How far the vividness is taken down: 0 as drawn, 1 black and white. */
  calm: number
  /** How far every colour is folded onto the arc: 0 not at all, 1 wholly. */
  pull: number
  /** The middle of the arc, as a part of the colour wheel (0 red, a third green, two thirds blue). */
  arcMid: number
  /** Half the arc's width, as a part of the wheel. */
  arcWide: number
}

const palette = (
  id: string,
  name: string,
  calm: number,
  pull = 0,
  arcMid = 0,
  arcWide = 0,
): VisualPalette => ({
  id,
  name,
  calm,
  pull,
  arcMid,
  arcWide,
})

export const VISUAL_PALETTES: readonly VisualPalette[] = [
  palette('vivid', 'Vivid', 0),
  palette('soft', 'Soft', 0.35),
  palette('faded', 'Faded', 0.6),
  palette('black-and-white', 'Black and white', 1),
  palette('green-and-blue', 'Green and blue', 0.35, 1, 0.455, 0.165),
  palette('moss', 'Moss', 0.45, 1, 0.3, 0.07),
  palette('forest', 'Forest', 0.4, 1, 0.37, 0.09),
  palette('sea', 'Sea', 0.35, 1, 0.53, 0.07),
  palette('ice', 'Ice', 0.6, 1, 0.56, 0.05),
  palette('night', 'Night', 0.45, 1, 0.66, 0.07),
  palette('lilac', 'Lilac', 0.5, 1, 0.76, 0.06),
  palette('dusk', 'Dusk', 0.35, 1, 0.86, 0.13),
  palette('rose', 'Rose', 0.5, 1, 0.95, 0.05),
  palette('ember', 'Ember', 0.3, 1, 0.045, 0.06),
  palette('sand', 'Sand', 0.62, 1, 0.095, 0.04),
  palette('earth', 'Earth', 0.5, 1, 0.16, 0.15),
]

/** The palette a piece has until one is chosen. */
export const DEFAULT_PALETTE = 'soft'

const palettesById = new Map(VISUAL_PALETTES.map((entry) => [entry.id, entry]))

/** The palette of that id; the default one for an id this build does not have. */
export function visualPalette(id: string): VisualPalette {
  return palettesById.get(id) ?? palettesById.get(DEFAULT_PALETTE) ?? VISUAL_PALETTES[0]
}

export function isVisualPalette(id: string): boolean {
  return palettesById.has(id)
}
