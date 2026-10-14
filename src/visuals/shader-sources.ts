// The text of every shader, each fetched the first time its style is drawn.
//
// One line for each file of `shaders/`; `__tests__/boundary.test.ts` holds the two lists together. The
// build makes a chunk of each, so a page that draws three styles loads three.

import common from './common.glsl'
import footer from './footer.glsl'

/** What stands before and after every style's own text. */
export const SHADER_COMMON: string = common
export const SHADER_FOOTER: string = footer

const text = (module: { default: string }): string => module.default

/* eslint-disable no-restricted-syntax -- some forty shaders of nine kilobytes each: one is loaded when its style is first drawn, not with the page */
export const SHADER_SOURCES: Readonly<Record<string, () => Promise<string>>> = {
  'bead-curtain': () => import('./shaders/bead-curtain.glsl').then(text),
  'black-hole': () => import('./shaders/black-hole.glsl').then(text),
  canopy: () => import('./shaders/canopy.glsl').then(text),
  clouds: () => import('./shaders/clouds.glsl').then(text),
  'colour-field': () => import('./shaders/colour-field.glsl').then(text),
  curtains: () => import('./shaders/curtains.glsl').then(text),
  'curved-lattice': () => import('./shaders/curved-lattice.glsl').then(text),
  'dot-globe': () => import('./shaders/dot-globe.glsl').then(text),
  'dot-land': () => import('./shaders/dot-land.glsl').then(text),
  'dot-lattice': () => import('./shaders/dot-lattice.glsl').then(text),
  'dot-screen': () => import('./shaders/dot-screen.glsl').then(text),
  'dot-tunnel': () => import('./shaders/dot-tunnel.glsl').then(text),
  'dot-wall': () => import('./shaders/dot-wall.glsl').then(text),
  dusk: () => import('./shaders/dusk.glsl').then(text),
  flock: () => import('./shaders/flock.glsl').then(text),
  flowers: () => import('./shaders/flowers.glsl').then(text),
  'folded-stone': () => import('./shaders/folded-stone.glsl').then(text),
  'grid-land': () => import('./shaders/grid-land.glsl').then(text),
  growth: () => import('./shaders/growth.glsl').then(text),
  hills: () => import('./shaders/hills.glsl').then(text),
  leaf: () => import('./shaders/leaf.glsl').then(text),
  'light-tunnel': () => import('./shaders/light-tunnel.glsl').then(text),
  'liquid-metal': () => import('./shaders/liquid-metal.glsl').then(text),
  'lit-cloud': () => import('./shaders/lit-cloud.glsl').then(text),
  meadow: () => import('./shaders/meadow.glsl').then(text),
  melt: () => import('./shaders/melt.glsl').then(text),
  moire: () => import('./shaders/moire.glsl').then(text),
  'night-city': () => import('./shaders/night-city.glsl').then(text),
  'night-sea': () => import('./shaders/night-sea.glsl').then(text),
  'pin-relief': () => import('./shaders/pin-relief.glsl').then(text),
  pond: () => import('./shaders/pond.glsl').then(text),
  press: () => import('./shaders/press.glsl').then(text),
  prism: () => import('./shaders/prism.glsl').then(text),
  ribbons: () => import('./shaders/ribbons.glsl').then(text),
  ripples: () => import('./shaders/ripples.glsl').then(text),
  silk: () => import('./shaders/silk.glsl').then(text),
  'soft-lights': () => import('./shaders/soft-lights.glsl').then(text),
  star: () => import('./shaders/star.glsl').then(text),
  'still-life': () => import('./shaders/still-life.glsl').then(text),
  sunflower: () => import('./shaders/sunflower.glsl').then(text),
  table: () => import('./shaders/table.glsl').then(text),
}
/* eslint-enable no-restricted-syntax */
