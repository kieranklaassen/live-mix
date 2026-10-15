// A canvas that keeps itself sharp and in the theme's colours: drawn at the screen's pixel ratio,
// and drawn again when its box changes size or the theme changes.

import { useEffect, useRef, type RefObject } from 'react'
import { ROLE_VAR, type Role } from './roles.ts'

export interface Colours {
  role: Record<Role, string>
  text: string
  muted: string
  grid: string
  line: string
  bg: string
  panel: string
  playhead: string
}

let cached: { theme: string | null; colours: Colours } | undefined

/** The theme's colours as a canvas needs them: the values of the CSS variables right now. */
export function colours(): Colours {
  const root = document.documentElement
  const theme = root.getAttribute('data-lm-theme')
  if (cached && cached.theme === theme) return cached.colours
  const style = getComputedStyle(root)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  const role = {} as Record<Role, string>
  for (const [key, name] of Object.entries(ROLE_VAR)) role[key as Role] = read(name, '#888')
  const value: Colours = {
    role,
    text: read('--lm-text', '#111'),
    muted: read('--lm-muted', '#777'),
    grid: read('--lm-grid-line', '#eee'),
    line: read('--sig-grid', '#ccc'),
    bg: read('--lm-bg', '#fff'),
    panel: read('--lm-panel', '#f4f4f4'),
    playhead: read('--lm-playhead', '#e33'),
  }
  cached = { theme, colours: value }
  return value
}

/** A CSS colour as three numbers, by letting the browser paint it. */
export function rgbOf(colour: string): [number, number, number] {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return [128, 128, 128]
  context.fillStyle = colour
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return [r ?? 128, g ?? 128, b ?? 128]
}

export type Draw = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  c: Colours,
) => void

/**
 * A ref for a canvas that `draw` paints, in CSS pixels. Painted again when `deps` change, when
 * the canvas changes size, and when the theme changes.
 */
export function useCanvas(
  draw: Draw,
  deps: readonly unknown[],
): RefObject<HTMLCanvasElement | null> {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const latest = useRef(draw)
  latest.current = draw

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let frame = 0
    const paint = () => {
      frame = 0
      const box = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.round(box.width))
      const height = Math.max(1, Math.round(box.height))
      const ratio = Math.min(3, window.devicePixelRatio || 1)
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio
        canvas.height = height * ratio
      }
      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      latest.current(context, width, height, colours())
    }
    const ask = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    paint()
    const sizes = new ResizeObserver(ask)
    sizes.observe(canvas)
    const theme = new MutationObserver(ask)
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-lm-theme'],
    })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      sizes.disconnect()
      theme.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
