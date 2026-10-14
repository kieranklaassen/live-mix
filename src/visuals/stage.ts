// Paints a frame of the visuals onto a canvas.
//
// What paints adds its light to what is there; what bends works on what was painted before it. The picture is
// finished on a canvas of its own and film grain is laid over the copy that is shown, so that Trails, which keeps
// what was on the screen a while, never drags old grain along.
//
// Browser only.

import type { VisualFrame } from './frame'
import { have } from './have'
import { visualRig } from './rig'

/** A style is never drawn wider than this; a larger screen is given it enlarged. */
export const WIDEST_DRAWN = 960

export interface Stage {
  /**
   * Paints the frame over the whole canvas. `scale` is how many pixels of the canvas a point of the page is. True
   * when a style was not ready yet and the frame should be painted again, though nothing has changed.
   */
  paint(context: CanvasRenderingContext2D, frame: VisualFrame, scale: number): boolean
}

const pen = (canvas: HTMLCanvasElement): CanvasRenderingContext2D =>
  have(canvas.getContext('2d'), '2D context')

const clamp01 = (value: number): number => (value > 0 ? (value < 1 ? value : 1) : 0)

// Film grain. A few squares of noise are made once; each frame one of them is laid somewhere else, so the grain
// boils as it does on film. It works on the light (darker and lighter by turns) and lifts the blacks a very
// little, so that soft tones get a tooth.
const GRAIN_PX = 256
let grains: [tile: HTMLCanvasElement, lift: HTMLCanvasElement][] | null = null

function grainTiles(): [HTMLCanvasElement, HTMLCanvasElement][] {
  grains ??= [0, 1, 2, 3].map(() => {
    const tile = document.createElement('canvas')
    const lift = document.createElement('canvas')
    tile.width = tile.height = lift.width = lift.height = GRAIN_PX
    const tileContext = pen(tile)
    const noise = tileContext.createImageData(GRAIN_PX, GRAIN_PX)
    const dark = tileContext.createImageData(GRAIN_PX, GRAIN_PX)
    for (let pixel = 0; pixel < GRAIN_PX * GRAIN_PX; pixel++) {
      // A bell, not a flat spread: few grains are extreme.
      const bell = (Math.random() + Math.random() + Math.random()) / 3
      const value = clamp01(0.5 + (bell - 0.5) * 1.7)
      // A breath of colour in it.
      for (let part = 0; part < 3; part++)
        noise.data[pixel * 4 + part] = 255 * clamp01(value + (Math.random() - 0.5) * 0.08)
      noise.data[pixel * 4 + 3] = 255
      const speck = 255 * Math.pow(Math.random(), 3)
      dark.data[pixel * 4] = dark.data[pixel * 4 + 1] = dark.data[pixel * 4 + 2] = speck
      dark.data[pixel * 4 + 3] = 255
    }
    tileContext.putImageData(noise, 0, 0)
    pen(lift).putImageData(dark, 0, 0)
    return [tile, lift]
  })
  return grains
}

function grainOver(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  amount: number,
): void {
  const tiles = grainTiles()
  const [tile, lift] = tiles[Math.floor(Math.random() * tiles.length)]
  // A grain is about one point of the page, however sharp the screen.
  const size = GRAIN_PX * Math.max(1, scale)
  const lay = (image: HTMLCanvasElement, fromX: number, fromY: number) => {
    for (let y = fromY; y < height; y += size)
      for (let x = fromX; x < width; x += size) context.drawImage(image, x, y, size, size)
  }
  context.save()
  context.globalCompositeOperation = 'overlay'
  context.globalAlpha = Math.min(1, amount * 0.8)
  lay(tile, -Math.random() * size, -Math.random() * size)
  context.globalCompositeOperation = 'lighter'
  context.globalAlpha = amount * 0.06
  lay(lift, -Math.random() * size, -Math.random() * size)
  context.restore()
}

/** A stage of its own for each screen: it remembers what that screen showed, for Trails. */
export function createStage(): Stage {
  const layer = document.createElement('canvas')
  const sum = document.createElement('canvas')
  const before = document.createElement('canvas')
  const clean = document.createElement('canvas')
  return {
    paint(context, frame, scale) {
      const width = context.canvas.width
      const height = context.canvas.height
      for (const canvas of [layer, sum, before, clean]) {
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
        }
      }
      const layerContext = pen(layer)
      const sumContext = pen(sum)
      const beforeContext = pen(before)
      const cleanContext = pen(clean)
      const keep = () => {
        layerContext.setTransform(1, 0, 0, 1, 0, 0)
        layerContext.globalCompositeOperation = 'copy'
        layerContext.drawImage(sum, 0, 0)
        layerContext.globalCompositeOperation = 'source-over'
      }
      sumContext.setTransform(1, 0, 0, 1, 0, 0)
      sumContext.globalAlpha = 1
      sumContext.globalCompositeOperation = 'source-over'
      sumContext.clearRect(0, 0, width, height)

      const rig = visualRig()
      const small = Math.min(1, WIDEST_DRAWN / width)
      const drawnWidth = Math.max(1, Math.round(width * small))
      const drawnHeight = Math.max(1, Math.round(height * small))
      let length = 0
      let push = 0
      let grain = 0
      let later = false
      rig?.hear(frame.signals)
      for (const step of frame.layers) {
        if ('paint' in step) {
          const at = rig?.draw(
            {
              id: step.paint,
              variation: step.variation,
              size: step.size,
              glow: step.glow,
              hue: step.hue,
              palette: frame.palette,
            },
            drawnWidth,
            drawnHeight,
            frame.signals,
          )
          if (at === undefined) later = rig !== null
          if (!at || !rig) continue
          sumContext.globalAlpha = clamp01(step.level)
          sumContext.globalCompositeOperation = 'lighter'
          sumContext.drawImage(rig.canvas, at.x, at.y, at.w, at.h, 0, 0, width, height)
          sumContext.globalAlpha = 1
          sumContext.globalCompositeOperation = 'source-over'
        } else if (step.bend === 'mirror') {
          if (step.fold > 0.15) {
            keep()
            sumContext.clearRect(width / 2, 0, width / 2, height)
            sumContext.save()
            sumContext.translate(width, 0)
            sumContext.scale(-1, 1)
            sumContext.drawImage(layer, 0, 0, width / 2, height, 0, 0, width / 2, height)
            sumContext.restore()
          }
          if (step.fold > 0.6) {
            keep()
            sumContext.clearRect(0, height / 2, width, height / 2)
            sumContext.save()
            sumContext.translate(0, height)
            sumContext.scale(1, -1)
            sumContext.drawImage(layer, 0, 0, width, height / 2, 0, 0, width, height / 2)
            sumContext.restore()
          }
        } else if (step.bend === 'spin') {
          keep()
          sumContext.clearRect(0, 0, width, height)
          sumContext.save()
          sumContext.translate(width / 2, height / 2)
          const angle = step.turn * Math.PI * 2
          sumContext.rotate(angle)
          // As much larger as this turn asks, so the corners it uncovers are never empty.
          const cover =
            Math.abs(Math.cos(angle)) +
            Math.max(width / height, height / width) * Math.abs(Math.sin(angle))
          sumContext.scale(cover, cover)
          sumContext.drawImage(layer, -width / 2, -height / 2)
          sumContext.restore()
        } else if (step.bend === 'trails') {
          length = Math.max(length, step.length)
          push = Math.max(push, step.push)
        } else {
          grain = Math.max(grain, step.amount)
        }
      }

      cleanContext.setTransform(1, 0, 0, 1, 0, 0)
      cleanContext.globalAlpha = 1
      cleanContext.globalCompositeOperation = 'source-over'
      if (length > 0.03) {
        // What was on the screen stays a while, and drifts outward with Push.
        beforeContext.globalCompositeOperation = 'copy'
        beforeContext.drawImage(clean, 0, 0)
        cleanContext.fillStyle = '#000'
        cleanContext.fillRect(0, 0, width, height)
        const grown = 1 + push * 0.035
        cleanContext.globalAlpha = 0.55 + 0.42 * clamp01(length)
        cleanContext.drawImage(
          before,
          (width - width * grown) / 2,
          (height - height * grown) / 2,
          width * grown,
          height * grown,
        )
        cleanContext.globalAlpha = 1
        cleanContext.globalCompositeOperation = 'lighten'
        cleanContext.drawImage(sum, 0, 0)
        cleanContext.globalCompositeOperation = 'source-over'
      } else {
        cleanContext.fillStyle = '#000'
        cleanContext.fillRect(0, 0, width, height)
        cleanContext.drawImage(sum, 0, 0)
      }

      context.setTransform(1, 0, 0, 1, 0, 0)
      context.globalAlpha = 1
      context.globalCompositeOperation = 'copy'
      context.drawImage(clean, 0, 0)
      context.globalCompositeOperation = 'source-over'
      // More grain, on the timeline, can ask for more than the piece has, for its stretch.
      const rough = Math.max(frame.grain, grain)
      // A small picture is a large one seen from further off, where grain is finer: it gets less of it.
      if (rough > 0.01)
        grainOver(
          context,
          width,
          height,
          scale,
          rough * Math.min(1, Math.max(0.45, width / scale / 800)),
        )
      return later
    },
  }
}
