// The visuals in a real browser: every style's shader is fetched, made and
// drawn through the built entry, as a consumer's page does it. Node has no
// WebGL, so this is the only place the shaders themselves are held to
// anything: that each compiles, and that what it draws is a picture.

import {
  VISUAL_BENDS,
  VISUAL_STYLES,
  VisualDesk,
  addVisual,
  createStage,
  emptyVisualSet,
  showVisuals,
  visualsReady,
  type DeskReading,
  type FollowedStroke,
  type VisualFrame,
  type VisualSet,
} from '@kieranklaassen/live-mix/visuals'

const WIDTH = 320
const HEIGHT = 180
/** A frame of the picture, in milliseconds. */
const FRAME_MS = 1000 / 30
/** A shader that is not made after this many frames is one that never will be. */
const WAIT_FRAMES = 1800
/** How many frames are looked at once the style draws: the brightest is measured. */
const LOOK_FRAMES = 24

export interface Measured {
  /** False where the style was given up on, or was still being made at the end. */
  drawn: boolean
  /** How bright the picture is on average, 0 to 255. */
  mean: number
  /** The part of it that is not black, 0 to 1. */
  lit: number
  /** How far its pixels differ from one another, as the standard deviation of their brightness. */
  spread: number
}

function measure(context: CanvasRenderingContext2D): Omit<Measured, 'drawn'> {
  const { data } = context.getImageData(0, 0, WIDTH, HEIGHT)
  const count = data.length / 4
  let sum = 0
  let squares = 0
  let lit = 0
  for (let at = 0; at < data.length; at += 4) {
    const bright = (data[at] + data[at + 1] + data[at + 2]) / 3
    sum += bright
    squares += bright * bright
    if (Math.max(data[at], data[at + 1], data[at + 2]) > 12) lit += 1
  }
  const mean = sum / count
  return { mean, lit: lit / count, spread: Math.sqrt(Math.max(0, squares / count - mean * mean)) }
}

/** Three strokes that sound for the whole of the piece: a drone at the back, a pad in the middle, a melody in front. */
const STROKES: FollowedStroke[] = (
  [
    ['drone', 0.15, [0.3, 0.5, 0.9]],
    ['pad', 0.5, [0.9, 0.6, 0.3]],
    ['melodic', 0.85, [0.5, 0.9, 0.5]],
  ] as const
).map(([slot, depth, colour]) => ({
  id: slot,
  startSec: 0,
  durationSec: 60,
  fadeInSec: 0.5,
  fadeOutSec: 0.5,
  depth,
  thickness: 0.2,
  gain: 0.8,
  slot,
  colour,
}))

/** A piece that plays, with the mix heard half way up in every band. */
function reading(set: VisualSet, nowMs: number): DeskReading {
  return {
    set,
    playheadSec: (nowMs / 1000) % 60,
    pieceSec: 60,
    beatSec: 0.5,
    playing: true,
    strokes: STROKES,
    heard: { level: 0.6, bands: new Float32Array(16).fill(0.5) },
    energy: 0.6,
    space: 0.5,
    tone: 0.5,
    input: 0,
  }
}

const nextFrame = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

/** Paints frames of `frameAt` until the picture draws, then looks at a few more and measures the brightest. */
async function look(frameAt: (nowMs: number) => VisualFrame): Promise<Measured> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('no 2D context')
  const stage = createStage()
  let now = 1000
  let waited = 0
  while (stage.paint(context, frameAt(now), 1)) {
    if (++waited > WAIT_FRAMES) return { drawn: false, mean: 0, lit: 0, spread: 0 }
    now += FRAME_MS
    await nextFrame()
  }
  let best = measure(context)
  for (let frame = 0; frame < LOOK_FRAMES; frame++) {
    now += FRAME_MS * 4
    stage.paint(context, frameAt(now), 1)
    const seen = measure(context)
    if (seen.mean > best.mean) best = seen
  }
  return { drawn: true, ...best }
}

const harness = {
  ready: (): boolean => visualsReady(),
  styles: (): string[] => VISUAL_STYLES.map((style) => style.id),
  bends: (): string[] => VISUAL_BENDS.map((bend) => bend.id),

  /** One style alone, as a host's list of styles shows it: with the small piece the desk plays for it. */
  async style(id: string, variation: 0 | 1): Promise<Measured> {
    let now = 0
    const desk = new VisualDesk(() => ({ ...reading(emptyVisualSet(), now), playing: false }))
    return look((nowMs) => {
      now = nowMs
      return desk.sample(id, variation, nowMs)
    })
  },

  /** A piece's own picture: one style for the whole piece, with a bend over it where one is named. */
  async piece(style: string, bend: string | null): Promise<Measured> {
    let set = addVisual(emptyVisualSet(), style).set
    if (bend !== null) set = addVisual(set, bend).set
    let now = 0
    const desk = new VisualDesk(() => reading(set, now))
    return look((nowMs) => {
      now = nowMs
      return desk.frame(nowMs)
    })
  },

  /** `showVisuals` on the canvas of the page, left to paint by itself for a while. */
  async shown(style: string, forMs: number): Promise<Measured & { started: boolean }> {
    const canvas = document.getElementById('shown') as HTMLCanvasElement
    const set = addVisual(emptyVisualSet(), style).set
    let now = 0
    const desk = new VisualDesk(() => reading(set, now))
    const stop = showVisuals(canvas, (nowMs) => {
      now = nowMs
      return desk.frame(nowMs)
    })
    if (!stop) return { started: false, drawn: false, mean: 0, lit: 0, spread: 0 }
    await new Promise((resolve) => setTimeout(resolve, forMs))
    stop()
    const copy = document.createElement('canvas')
    copy.width = WIDTH
    copy.height = HEIGHT
    const context = copy.getContext('2d')
    if (!context) throw new Error('no 2D context')
    context.drawImage(canvas, 0, 0, WIDTH, HEIGHT)
    const seen = measure(context)
    return { started: true, drawn: seen.lit > 0, ...seen }
  },
}

export type VisualsHarness = typeof harness

declare global {
  interface Window {
    visualsHarness: VisualsHarness
  }
}

window.visualsHarness = harness
