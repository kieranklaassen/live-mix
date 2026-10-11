// The studio look, on a plate. A host asks for it for every plate under it
// (`PlateLookProvider`) or for one (`DevicePlate`'s `look`); the flat plate is
// the kit's own look and stays what is drawn wherever the photograph cannot
// be: without WebGL, on the server, before the plate has a size.
//
// The photograph (`studio-face.ts`) lies under everything the plate holds. It
// is taken from where the parts stand on the page, so it follows whatever the
// plate's layout and its stylesheet make of them: the knobs, the display's
// window, the preset's, the cells that open something, the lamp. The plate is
// marked `data-lm-look="studio"` only once a photograph is on it, and the
// stylesheet does the rest from that mark: the flat finish and the knobs' flat
// caps go, the lettering takes the colours the photograph was taken in.

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import { normToKnobAngle } from './control-math'
import { type KnobCap } from './Knob'
import { lookAtPlateDisplays } from './PlateDisplay'
import {
  cssRgb,
  drawStudioFace,
  readCssColour,
  studioPalette,
  studioReady,
  watchStudio,
  type FaceBox,
  type FaceScene,
  type StudioPalette,
} from './studio-face'

/**
 * How a plate is drawn: `flat` in its skin's three colours and its finish, or
 * `studio` as a photograph from above, lit from the upper left.
 */
export type PlateLook = 'flat' | 'studio'

const PlateLookContext = createContext<PlateLook>('flat')

export interface PlateLookProviderProps {
  look: PlateLook
  children?: ReactNode
}

/** Sets the look of every plate under it. Without one a plate is flat. */
export function PlateLookProvider({ look, children }: PlateLookProviderProps) {
  return createElement(PlateLookContext.Provider, { value: look }, children)
}

/** The look the plates here were asked to have. */
export function usePlateLook(): PlateLook {
  return useContext(PlateLookContext)
}

const never = (): boolean => false

/**
 * Whether a plate is photographed: it was asked to be (`look`, or else the
 * provider's) and this machine can do it. False on the server and for the
 * first draw after it, so what the server sent is the flat plate.
 */
export function useStudioLook(look?: PlateLook): boolean {
  const asked = usePlateLook()
  const wanted = (look ?? asked) === 'studio'
  return useSyncExternalStore(watchStudio, wanted ? studioReady : never, never)
}

/** The mark a photographed plate carries, and the colours it hands the stylesheet. */
const LOOK_MARK = 'data-lm-look'
const PAINTS = {
  '--lm-studio-paint': 'paint',
  '--lm-studio-word': 'word',
  '--lm-studio-key': 'key',
  '--lm-studio-legend': 'legend',
  '--lm-studio-glass': 'glass',
  '--lm-studio-screen': 'screenInk',
  '--lm-studio-mark': 'screenMark',
} as const satisfies Record<string, keyof StudioPalette>

/** Where a plate's parts stand, in px from its top left corner. */
interface Parts {
  width: number
  height: number
  knobs: readonly FaceBox[]
  display: FaceBox | null
  preset: FaceBox | null
  keys: readonly FaceBox[]
  lamp: FaceBox | null
}

function measure(plate: HTMLElement): Parts | null {
  const frame = plate.getBoundingClientRect()
  const width = plate.offsetWidth
  const height = plate.offsetHeight
  if (width < 1 || height < 1 || frame.width <= 0 || frame.height <= 0) return null
  // A plate that is shown larger or smaller (a host's zoom) is measured in its own px.
  const sx = frame.width / width
  const sy = frame.height / height
  const box = (part: Element): FaceBox => {
    const at = part.getBoundingClientRect()
    return {
      x: (at.left - frame.left) / sx,
      y: (at.top - frame.top) / sy,
      w: at.width / sx,
      h: at.height / sy,
    }
  }
  const one = (selector: string): FaceBox | null => {
    const part = plate.querySelector(selector)
    const at = part ? box(part) : null
    return at && at.w > 0 && at.h > 0 ? at : null
  }
  return {
    width,
    height,
    knobs: [...plate.querySelectorAll('.lm-plate__knob .lm-knob__control')].map(box),
    display: one(':scope > .lm-plate__display'),
    // The kit's own preset cell is a pane of glass; whatever else a host puts there stands on the paint.
    preset: one('.lm-plate__presets > .lm-fxp'),
    keys: [...plate.querySelectorAll(':scope > .lm-plate__more')].map(box),
    lamp: one('.lm-plate__lamp'),
  }
}

const shapeOf = (parts: Parts | null): string =>
  parts
    ? [parts.width, parts.height, parts.knobs, parts.display, parts.preset, parts.keys, parts.lamp]
        .flat()
        .map((part) =>
          part && typeof part === 'object'
            ? `${part.x.toFixed(1)} ${part.y.toFixed(1)} ${part.w.toFixed(1)} ${part.h.toFixed(1)}`
            : String(part),
        )
        .join('|')
    : ''

// Every photographed plate, for the once-a-second look at what no render
// tells: a theme that changed the skin's colours, a screen with another pixel
// ratio.
const looking = new Set<() => void>()
let lookTimer: ReturnType<typeof setInterval> | null = null

function lookAfter(look: () => void): () => void {
  looking.add(look)
  lookTimer ??= setInterval(() => looking.forEach((each) => each()), 1000)
  return () => {
    looking.delete(look)
    if (looking.size === 0 && lookTimer !== null) {
      clearInterval(lookTimer)
      lookTimer = null
    }
  }
}

export interface StudioFaceProps {
  cap: Exclude<KnobCap, 'arc'>
  /** Where each knob on the plate stands in its travel, 0..1, in the order they are on it. */
  turns: readonly number[]
  powered: boolean
  /** Anything that says where the plate's parts are: when it changes they are measured again. */
  shape: string
}

/** Where a knob points as the photograph wants it: radians from straight up, clockwise (the kit's angle is from the right). */
const pointing = (turn: number): number => ((normToKnobAngle(turn) + 90) * Math.PI) / 180

const NOTHING = { shape: null, parts: null, colours: '', palette: null, taken: '' }

/**
 * The photograph under a plate's parts: the first thing in the plate. It is
 * taken again when a knob turns, the lamp goes on or off, a part moves, or
 * the skin's colours change, and at no other time.
 */
export function StudioFace({ cap, turns, powered, shape }: StudioFaceProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const held = useRef<{
    shape: string | null
    parts: Parts | null
    colours: string
    palette: StudioPalette | null
    taken: string
  }>({ ...NOTHING })
  // Counts what a render does not tell: a part that moved by itself, a colour a theme changed.
  const [again, setAgain] = useState(0)

  useLayoutEffect(() => {
    const canvas = ref.current
    const plate = canvas?.parentElement
    if (!canvas || !plate) return
    const now = held.current
    const asked = `${shape}|${again}`
    if (now.shape !== asked) {
      now.shape = asked
      now.parts = measure(plate)
    }
    // A display paints in colours it reads from the stylesheet: it is told when they change.
    let tell = false
    // The skin's three colours, each from a property whose computed value is a colour whatever the skin wrote.
    const style = getComputedStyle(canvas)
    const colours = `${style.color}|${style.outlineColor}|${style.textDecorationColor}`
    if (colours !== now.colours) {
      tell = true
      now.colours = colours
      const ink = readCssColour(style.color)
      const accent = readCssColour(style.outlineColor)
      const paint = readCssColour(style.textDecorationColor)
      now.palette = ink && accent && paint ? studioPalette(paint, ink, accent) : null
      now.taken = ''
      for (const [name, part] of Object.entries(PAINTS)) {
        if (now.palette) plate.style.setProperty(name, cssRgb(now.palette[part]))
        else plate.style.removeProperty(name)
      }
    }
    const { parts, palette } = now
    const ratio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
    const stamp = [
      shapeOf(parts),
      cap,
      powered,
      ratio,
      colours,
      turns.map((turn) => turn.toFixed(4)).join(' '),
    ].join('~')
    if (stamp === now.taken) return
    let taken = false
    if (parts && palette && parts.knobs.length === turns.length) {
      const scene: FaceScene = {
        width: parts.width,
        height: parts.height,
        cap,
        knobs: parts.knobs.map((knob, index) => ({
          x: knob.x + knob.w / 2,
          y: knob.y + knob.h / 2,
          size: knob.w,
          angle: pointing(turns[index]),
        })),
        display: parts.display,
        preset: parts.preset,
        keys: parts.keys,
        lamp: parts.lamp
          ? { x: parts.lamp.x + parts.lamp.w / 2, y: parts.lamp.y + parts.lamp.h / 2 }
          : null,
        powered,
      }
      taken = drawStudioFace(canvas, scene, palette)
    }
    now.taken = taken ? stamp : ''
    const marked = plate.getAttribute(LOOK_MARK) === 'studio'
    if (taken && !marked) plate.setAttribute(LOOK_MARK, 'studio')
    else if (!taken && marked) plate.removeAttribute(LOOK_MARK)
    if (tell || taken !== marked) lookAtPlateDisplays()
  })

  useEffect(() => {
    const canvas = ref.current
    const plate = canvas?.parentElement
    if (!canvas || !plate) return
    const once = (): void => setAgain((count) => count + 1)
    // A part that moved without a render: the plate stretched, a host's preset cell arrived or grew.
    const watched =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (shapeOf(measure(plate)) !== shapeOf(held.current.parts)) once()
          })
        : null
    watched?.observe(plate)
    // A preset's cell is as wide as its name: it is watched for a name that changed.
    const renamed =
      typeof MutationObserver === 'function'
        ? new MutationObserver(() => {
            if (shapeOf(measure(plate)) !== shapeOf(held.current.parts)) once()
          })
        : null
    for (const part of plate.querySelectorAll('.lm-plate__presets, .lm-plate__foot')) {
      watched?.observe(part)
      renamed?.observe(part, { subtree: true, childList: true, characterData: true })
    }
    let ratio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
    const unlook = lookAfter(() => {
      const style = getComputedStyle(canvas)
      const colours = `${style.color}|${style.outlineColor}|${style.textDecorationColor}`
      const next = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
      if (colours !== held.current.colours || next !== ratio) {
        ratio = next
        once()
      }
    })
    return () => {
      watched?.disconnect()
      renamed?.disconnect()
      unlook()
      // The plate is flat again, and a face put back (a strict render) starts from nothing.
      held.current = { ...NOTHING }
      plate.removeAttribute(LOOK_MARK)
      for (const name of Object.keys(PAINTS)) plate.style.removeProperty(name)
      lookAtPlateDisplays()
    }
  }, [])

  return <canvas ref={ref} className="lm-plate__studio" aria-hidden="true" />
}
