// A canvas that shows the visuals: painted again on every frame from whatever `frameAt` answers.
//
// It knows nothing of the piece and no framework. The host hands it the frame to show, which is usually a desk's
// (`desk.ts`), and gets back the way to stop. Any number of canvases can show the same desk: asked twice in one
// frame it answers the same.
//
// Browser only.

import type { VisualFrame } from './frame'
import { visualsReady } from './rig'
import { createStage } from './stage'

/** A screen sharper than this is drawn as one this sharp: the picture is soft, and every pixel of it costs. */
const SHARPEST = 2
/** How often the picture is painted for someone who asked their system for less motion, a second. */
const CALM_FPS = 4

export interface ShowVisualsOptions {
  /** How often it is painted, a second: 30 where nothing is said. */
  fps?: number
  /** Painted at `fps` whatever the system says of motion: a picture that was asked to fill a screen. */
  always?: boolean
  /** Asked before each frame. While it answers true nothing is painted: the canvas is covered, or put away. */
  still?: () => boolean
  /** Told of a frame that could not be painted. The frame before it stays on the canvas. */
  onError?: (error: unknown) => void
}

/**
 * Paints `frameAt(now)` on the canvas for as long as it is shown, at the size the page gives the canvas. `now` is
 * a time in milliseconds that only ever grows. Hands back the way to stop; null where this browser cannot draw
 * the visuals (it has no WebGL 2), when nothing was started.
 */
export function showVisuals(
  canvas: HTMLCanvasElement,
  frameAt: (nowMs: number) => VisualFrame,
  options: ShowVisualsOptions = {},
): (() => void) | null {
  const { fps = 30, always = false, still, onError } = options
  if (!visualsReady()) return null
  const context = canvas.getContext('2d')
  if (!context) return null
  const stage = createStage()
  const calm =
    !always &&
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  const everyMs = 1000 / Math.max(1, calm ? Math.min(fps, CALM_FPS) : fps)
  let scale = 1
  const size = () => {
    scale = Math.min(window.devicePixelRatio || 1, SHARPEST)
    const width = Math.round(canvas.clientWidth * scale)
    const height = Math.round(canvas.clientHeight * scale)
    if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
      canvas.width = width
      canvas.height = height
    }
  }
  size()
  const sized = typeof ResizeObserver === 'function' ? new ResizeObserver(size) : null
  sized?.observe(canvas)
  let last = -Infinity
  let handle = 0
  const tick = (now: number) => {
    handle = requestAnimationFrame(tick)
    // A screen's own frames come a little early as often as late: one that is nearly due is painted.
    if (now - last < everyMs - 2) return
    // Put away (a folded pane, a tab that is not shown): nothing to paint on.
    if (still?.() || canvas.clientWidth === 0 || canvas.width === 0) return
    last = now
    try {
      stage.paint(context, frameAt(now), scale)
    } catch (error) {
      onError?.(error)
    }
  }
  handle = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(handle)
    sized?.disconnect()
  }
}

/** A picture is read this small: how lit it is as a whole is all that is asked. */
const LIGHT_W = 16
const LIGHT_H = 9
let lightPen: CanvasRenderingContext2D | null = null

/**
 * How lit a picture is as a whole, 0 (black) to 1 (white): what the scope holds against the sound (`sync.ts`).
 * The canvas may be another window's of this site. Null where it cannot be read.
 */
export function lightOf(canvas: HTMLCanvasElement): number | null {
  if (canvas.width === 0 || canvas.height === 0) return null
  try {
    if (!lightPen) {
      const small = document.createElement('canvas')
      small.width = LIGHT_W
      small.height = LIGHT_H
      lightPen = small.getContext('2d', { willReadFrequently: true })
    }
    if (!lightPen) return null
    lightPen.globalCompositeOperation = 'copy'
    lightPen.drawImage(canvas, 0, 0, LIGHT_W, LIGHT_H)
    const { data } = lightPen.getImageData(0, 0, LIGHT_W, LIGHT_H)
    let sum = 0
    for (let part = 0; part < data.length; part += 4)
      sum += 0.2126 * data[part] + 0.7152 * data[part + 1] + 0.0722 * data[part + 2]
    return sum / (255 * LIGHT_W * LIGHT_H)
  } catch {
    return null
  }
}
