// A look made by chance, looked at before it is shown.
//
// A style's own numbers were each looked at by whoever wrote it, and where its presets put them together. A look bred
// from two presets (`vary.ts`) stands between such places, and nearly always makes a picture; now and then it makes a
// black one, a burnt one, or one nobody can tell from the one before it. So it is drawn small, at two moments of a
// piece that always plays the same, and what came out is measured. One with a fault is dropped and another made; after
// a few of those the style's own numbers are left as they were, and only its colours, light and movement are varied.
//
// The drawing is the browser's; what is made of a picture is plain arithmetic on its pixels.

import { sampleFrame, type VisualSignals } from './frame'
import { visualPalette } from './palettes'
import type { VisualLook, VisualPreset } from './preset'
import { loadVisualPresets } from './presets'
import { visualRig, type VisualRig } from './rig'
import { standInSignals } from './stand-in'
import { visualStyle } from './styles'
import { colourOf, tintOf } from './tint'
import { lookName, variedLook, type Chance } from './vary'
import type { WorldColour } from './world'

/** How large a look is drawn to be looked at. */
export const PROOF_W = 128
export const PROOF_H = 72
/** The parts of a picture that are held against those of another. */
const CELLS_X = 16
const CELLS_Y = 9
/** The moments it is looked at, in seconds into the stand-in piece: one with most sounding, one with little. */
const PROOF_SEC = [6.2, 13.1]
/** How many looks are tried before only the colours are varied, and how long that may take. */
const MOST_TRIES = 4
const LONGEST_MS = 5000

/** What is measured of a picture; each 0 to 1. */
export interface LookPicture {
  /** How light it is on the whole, and the lightest fiftieth of it. */
  light: number
  most: number
  /** How far its points stand from how light it is on the whole, as a standard deviation. */
  spread: number
  /** How much of it is all but white. */
  burnt: number
  /** Red, green and blue of each part of it, for holding two pictures against each other. */
  cells: Float32Array
}

/** What is wrong with a look: nothing to see, all but nothing but white, nothing in it, or the picture there was. */
export type LookFault = 'black' | 'burnt' | 'flat' | 'same'

/** Measures pictures of one size laid end to end, red, green, blue and one more for each point, 0 to 255. */
export function measurePicture(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
): LookPicture {
  const count = width * height
  const cells = new Float32Array(CELLS_X * CELLS_Y * 3)
  const lights = new Float32Array(count)
  let sum = 0
  let burnt = 0
  for (let y = 0; y < height; y++) {
    const row = Math.min(CELLS_Y - 1, Math.floor((y * CELLS_Y) / height))
    for (let x = 0; x < width; x++) {
      const point = y * width + x
      const r = pixels[point * 4] / 255
      const g = pixels[point * 4 + 1] / 255
      const b = pixels[point * 4 + 2] / 255
      const light = 0.2126 * r + 0.7152 * g + 0.0722 * b
      lights[point] = light
      sum += light
      if (Math.min(r, g, b) > 0.96) burnt++
      const cell = (row * CELLS_X + Math.min(CELLS_X - 1, Math.floor((x * CELLS_X) / width))) * 3
      cells[cell] += r
      cells[cell + 1] += g
      cells[cell + 2] += b
    }
  }
  const light = sum / count
  let off = 0
  for (const value of lights) off += (value - light) ** 2
  for (let cell = 0; cell < cells.length; cell++) cells[cell] /= count / (CELLS_X * CELLS_Y)
  lights.sort()
  return {
    light,
    most: lights[Math.floor(count * 0.98)],
    spread: Math.sqrt(off / count),
    burnt: burnt / count,
    cells,
  }
}

/** How far two pictures stand apart, 0 to 1: the mean over their parts and colours. */
export function picturesApart(one: LookPicture, other: LookPicture): number {
  let apart = 0
  for (let cell = 0; cell < one.cells.length; cell++)
    apart += Math.abs(one.cells[cell] - other.cells[cell])
  return apart / one.cells.length
}

// Held against what every style and every preset was measured at: none of the 1,410 presets is found at fault by them.
const BLACK_MOST = 0.3
const BLACK_LIGHT = 0.06
const BURNT_SHARE = 0.12
const BURNT_LIGHT = 0.88
const FLAT_SPREAD = 0.032
const SAME_APART = 0.03

/**
 * What is wrong with a look that came out as these pictures, one for each moment, where what it was made from came out
 * as those; null where nothing is. A style that is all but black, or burnt, as it draws itself is not held to more.
 */
export function lookFault(
  pictures: readonly LookPicture[],
  before: readonly LookPicture[] | null,
): LookFault | null {
  const highest = (
    part: 'light' | 'most' | 'spread' | 'burnt',
  ): [now: number, was: number | null] => [
    Math.max(...pictures.map((picture) => picture[part])),
    before && Math.max(...before.map((picture) => picture[part])),
  ]
  const under = (part: 'light' | 'most' | 'spread', least: number): boolean => {
    const [now, was] = highest(part)
    return now < (was === null ? least : Math.min(least, was * 0.8))
  }
  const over = (part: 'light' | 'burnt', most: number): boolean => {
    const [now, was] = highest(part)
    return now > (was === null ? most : Math.max(most, was * 1.1))
  }
  if (under('most', BLACK_MOST) || under('light', BLACK_LIGHT)) return 'black'
  if (over('burnt', BURNT_SHARE) || over('light', BURNT_LIGHT)) return 'burnt'
  if (under('spread', FLAT_SPREAD)) return 'flat'
  if (
    before &&
    Math.max(...pictures.map((picture, at) => picturesApart(picture, before[at] ?? picture))) <
      SAME_APART
  )
    return 'same'
  return null
}

/** The colour pictures are seen in: the hue there is most of, as vivid and as light as what is lit in them. */
export function pictureColour(pictures: readonly LookPicture[]): WorldColour {
  let across = 0
  let up = 0
  let light = 0
  let vivid = 0
  let count = 0
  for (const { cells } of pictures)
    for (let cell = 0; cell < cells.length; cell += 3) {
      const tint = tintOf(hexOf(cells[cell], cells[cell + 1], cells[cell + 2]))
      // Most styles stand on black, and it is what stands there that has a colour.
      const seen = tint.light * tint.light
      across += seen * tint.vivid * Math.cos(tint.hue * 2 * Math.PI)
      up += seen * tint.vivid * Math.sin(tint.hue * 2 * Math.PI)
      light += seen * tint.light
      vivid += seen * tint.vivid
      count += seen
    }
  if (count === 0) return '#000000'
  const turn = Math.atan2(up, across) / (2 * Math.PI)
  return colourOf({ light: light / count, vivid: vivid / count, hue: turn - Math.floor(turn) })
}

function hexOf(...parts: readonly number[]): WorldColour {
  const two = (part: number) =>
    Math.round(Math.min(1, Math.max(0, part)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${parts.map(two).join('')}`
}

const nextFrame = (): Promise<void> =>
  new Promise((done) => {
    // A page that is not shown gets no frames.
    const later = setTimeout(done, 120)
    if (document.visibilityState === 'visible')
      requestAnimationFrame(() => {
        clearTimeout(later)
        done()
      })
  })

let pad: CanvasRenderingContext2D | null = null

function read(canvas: HTMLCanvasElement, x: number, y: number): Uint8ClampedArray | null {
  if (!pad) {
    const small = document.createElement('canvas')
    small.width = PROOF_W
    small.height = PROOF_H
    pad = small.getContext('2d', { willReadFrequently: true })
  }
  if (!pad) return null
  pad.globalCompositeOperation = 'copy'
  pad.drawImage(canvas, x, y, PROOF_W, PROOF_H, 0, 0, PROOF_W, PROOF_H)
  return pad.getImageData(0, 0, PROOF_W, PROOF_H).data
}

let moments: readonly VisualSignals[] | null = null

/**
 * Draws a look small at each moment, once its shader is made, and measures it. Null where it cannot be drawn, or was
 * not ready in time.
 */
export async function proofLook(
  kind: string,
  variation: 0 | 1,
  look: VisualPreset | VisualLook | null,
  untilMs = performance.now() + LONGEST_MS,
): Promise<LookPicture[] | null> {
  const rig: VisualRig | null = visualRig()
  if (!rig || !visualStyle(kind)) return null
  moments ??= PROOF_SEC.map(standInSignals)
  const palette = visualPalette('kinds')
  const pictures: LookPicture[] = []
  for (const signals of moments) {
    const layer = sampleFrame(kind, look?.variation ?? variation, signals, palette, 0, look)
      .layers[0]
    if (!layer || !('paint' in layer)) return null
    for (;;) {
      rig.hear(signals)
      const at = rig.draw(
        { ...layer, id: kind, palette, world: look?.world ?? null },
        PROOF_W,
        PROOF_H,
        signals,
      )
      if (at === null) return null
      if (at && !at.stand) {
        const pixels = read(rig.canvas, at.x, at.y)
        if (!pixels) return null
        pictures.push(measurePicture(pixels, PROOF_W, PROOF_H))
        break
      }
      if (performance.now() > untilMs) return null
      await nextFrame()
    }
  }
  return pictures
}

/** What a new look is asked for. */
export interface NewLookRequest {
  kind: string
  /** The preset or the look it is a variation of; left out or null, the style as it draws itself. */
  base?: VisualPreset | VisualLook | null
  /** The variation of the style, where there is no base. */
  variation?: 0 | 1
  /** Chance, 0 up to 1; left out, the browser's. */
  chance?: Chance
}

/**
 * A new look of a style, made by chance from what it starts from and looked at before it is handed over. Its shader
 * is made by then, so it is drawn at once. Where nothing can be drawn it is handed over as it was made. Null for what
 * is not a style.
 *
 * One press, one look: each look is a shader to make, so it is not for a frame, nor for a drag.
 */
export async function newLook(request: NewLookRequest): Promise<VisualLook | null> {
  const { kind, base = null, variation = 0, chance = Math.random } = request
  const named = (look: VisualLook, pictures: readonly LookPicture[] | null): VisualLook =>
    pictures ? { ...look, called: lookName(look.world, chance, pictureColour(pictures)) } : look
  if (!visualStyle(kind)) return null
  const presets = await loadVisualPresets(kind).catch((): readonly VisualPreset[] => [])
  const from = { base, variation, presets }
  if (!visualRig()) return variedLook(from, chance)
  const until = performance.now() + LONGEST_MS
  const before = await proofLook(kind, variation, base, until)
  for (let tries = 0; tries < MOST_TRIES && performance.now() < until; tries++) {
    const look = variedLook(from, chance)
    const pictures = await proofLook(kind, variation, look, until)
    if (pictures && lookFault(pictures, before) === null) return named(look, pictures)
  }
  // Its own numbers as they were: no shader to make, and as little to go wrong.
  let look = variedLook(from, chance, false)
  for (let tries = 0; tries < MOST_TRIES; tries++) {
    const pictures = await proofLook(kind, variation, look)
    if (!pictures || lookFault(pictures, before) === null) return named(look, pictures)
    look = variedLook(from, chance, false)
  }
  return look
}
