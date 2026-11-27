// Colours moved as the eye sees them: a hue turned, a colour made paler or more vivid, with how light it is kept. The
// numbers are OKLab's, a space in which equal steps look equal.
//
// Pure: no React, no DOM, no audio.

import type { WorldColour } from './world'

/** A colour by how light it is (0 to 1), how vivid (0 to about 0.35) and its hue in turns (0 to 1). */
export interface Tint {
  light: number
  vivid: number
  hue: number
}

const linear = (value: number): number =>
  value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
const gamma = (value: number): number =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055

/** A colour `#rrggbb` as a tint; a text that is no colour is black. */
export function tintOf(colour: WorldColour): Tint {
  const found = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(colour)
  const [r, g, b] = [1, 2, 3].map((part) =>
    linear(found ? parseInt(found[part] ?? '0', 16) / 255 : 0),
  )
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const across = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const up = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const turn = Math.atan2(up, across) / (2 * Math.PI)
  return {
    light: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    vivid: Math.hypot(across, up),
    hue: turn - Math.floor(turn),
  }
}

function shown({ light, vivid, hue }: Tint): [number, number, number] {
  const angle = hue * 2 * Math.PI
  const across = vivid * Math.cos(angle)
  const up = vivid * Math.sin(angle)
  const l = (light + 0.3963377774 * across + 0.2158037573 * up) ** 3
  const m = (light - 0.1055613458 * across - 0.0638541728 * up) ** 3
  const s = (light - 0.0894841775 * across - 1.291485548 * up) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const within = (parts: readonly number[]): boolean =>
  parts.every((part) => part >= -0.001 && part <= 1.001)

/** A tint as `#rrggbb`. One a screen cannot show is made paler until it can, with its hue and its light kept. */
export function colourOf(tint: Tint): WorldColour {
  const light = Math.min(1, Math.max(0, tint.light))
  let vivid = Math.max(0, tint.vivid)
  let parts = shown({ light, vivid, hue: tint.hue })
  for (let step = 0; step < 24 && !within(parts); step++) {
    vivid *= 0.85
    parts = shown({ light, vivid, hue: tint.hue })
  }
  const hex = parts.map((part) =>
    Math.round(Math.min(1, Math.max(0, gamma(Math.min(1, Math.max(0, part))))) * 255)
      .toString(16)
      .padStart(2, '0'),
  )
  return `#${hex.join('')}`
}

/** A colour with its hue turned by a share of the whole wheel, and as many times as vivid. How light it is stays. */
export function turned(colour: WorldColour, turn: number, vivid = 1): WorldColour {
  const was = tintOf(colour)
  const hue = was.hue + turn
  return colourOf({ light: was.light, vivid: was.vivid * vivid, hue: hue - Math.floor(hue) })
}
