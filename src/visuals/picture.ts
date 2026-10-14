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
