// A canvas that keeps itself sharp, in the scheme's colours and in the page's type: drawn at the
// screen's pixel ratio, and drawn again when its box changes size, when the scheme changes and
// when a typeface arrives.

import { useEffect, useRef, type RefObject } from 'react'
import { label, ticks, type Axis } from './draw.ts'
import { ROLE_VAR, type Role } from './roles.ts'

/** The room round a picture for its numbers. */
export const EDGE = { left: 44, right: 10, top: 8, bottom: 22 }
/**
 * The type a picture's numbers are set in: the page's mono family. A canvas cannot name a CSS
 * variable, so `colours()` reads the family off the page and sets this before a picture is
 * drawn. Read it while drawing, never once at the top of a module.
 */
export let MONO = '10px monospace'

/** How far one character of a number runs: 10 px of a mono face, where every character is as wide. */
const DIGIT = 6

export interface Colours {
  role: Record<Role, string>
  muted: string
  grid: string
  line: string
  bg: string
  panel: string
  /** The ground a lane of a figure lies on. */
  sunken: string
}

let cached: { theme: string | null; colours: Colours } | undefined

/**
 * The scheme's colours as a canvas needs them: the values of the CSS variables right now. The
 * mono family is read on the same visit.
 */
export function colours(): Colours {
  const root = document.documentElement
  const theme = root.getAttribute('data-lm-theme')
  if (cached && cached.theme === theme) return cached.colours
  const style = getComputedStyle(root)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  MONO = `10px ${read('--lm-font-mono', 'monospace')}`
  const role = {} as Record<Role, string>
  for (const [key, name] of Object.entries(ROLE_VAR)) role[key as Role] = read(name, '#888')
  const value: Colours = {
    role,
    muted: read('--lm-muted', '#777'),
    grid: read('--lm-grid-line', '#eee'),
    line: read('--sig-grid', '#ccc'),
    bg: read('--lm-bg', '#fff'),
    panel: read('--lm-panel', '#f4f4f4'),
    sunken: read('--lm-sunken', '#eee'),
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

function paint(canvas: HTMLCanvasElement, draw: Draw): void {
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
  draw(context, width, height, colours())
}

/**
 * A ref for a canvas that `draw` paints, in CSS pixels. Painted again when `deps` change, when
 * the canvas changes size, when the scheme changes, and when a typeface has loaded: numbers drawn
 * before their face arrived are in its stand-in.
 */
export function useCanvas(
  draw: Draw,
  deps: readonly unknown[],
): RefObject<HTMLCanvasElement | null> {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const latest = useRef(draw)
  latest.current = draw

  useEffect(() => {
    if (ref.current) paint(ref.current, latest.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let frame = 0
    const repaint = () => {
      frame = 0
      paint(canvas, latest.current)
    }
    const ask = () => {
      if (!frame) frame = requestAnimationFrame(repaint)
    }
    const sizes = new ResizeObserver(ask)
    sizes.observe(canvas)
    const theme = new MutationObserver(ask)
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-lm-theme'],
    })
    document.fonts.addEventListener('loadingdone', ask)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      sizes.disconnect()
      theme.disconnect()
      document.fonts.removeEventListener('loadingdone', ask)
    }
  }, [])

  return ref
}

/**
 * The grid of a picture and its numbers: a line across at each round value of `y`, a line up at
 * each of `x`, and the frame round them, `w` by `h` inside EDGE. `at` says where a value stands.
 * A number along the bottom that would run into the one before it, or off the picture, is left
 * out; its line is still drawn. Every figure with axes draws its grid here, once.
 */
export function drawGrid(
  context: CanvasRenderingContext2D,
  c: Colours,
  w: number,
  h: number,
  x: { axis: Axis; at: (value: number) => number },
  y: { axis: Axis; at: (value: number) => number },
): void {
  context.font = MONO
  context.lineWidth = 1
  context.textBaseline = 'middle'
  context.textAlign = 'right'
  for (const value of ticks(y.axis, Math.max(2, Math.round(h / 44)))) {
    const at = Math.round(y.at(value)) + 0.5
    context.strokeStyle = value === 0 ? c.line : c.grid
    context.beginPath()
    context.moveTo(EDGE.left, at)
    context.lineTo(EDGE.left + w, at)
    context.stroke()
    context.fillStyle = c.muted
    context.fillText(label(value), EDGE.left - 6, at)
  }
  context.textBaseline = 'top'
  context.textAlign = 'center'
  let lastLabelEnd = -Infinity
  for (const value of ticks(x.axis, Math.max(2, Math.round(w / 90)))) {
    const at = Math.round(x.at(value)) + 0.5
    context.strokeStyle = c.grid
    context.beginPath()
    context.moveTo(at, EDGE.top)
    context.lineTo(at, EDGE.top + h)
    context.stroke()
    const text = label(value)
    const half = (text.length * DIGIT) / 2
    if (at - half > lastLabelEnd + 6 && at + half <= EDGE.left + w + EDGE.right) {
      context.fillStyle = c.muted
      context.fillText(text, at, EDGE.top + h + 6)
      lastLabelEnd = at + half
    }
  }
  context.strokeStyle = c.line
  context.strokeRect(EDGE.left + 0.5, EDGE.top + 0.5, w - 1, h - 1)
}
