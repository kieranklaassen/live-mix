// Runs one plate display (`plate-display.ts`): a canvas that is drawn on
// frames while it can be seen and the device is on, and once per change
// otherwise. `DisplayRunner` does the work and knows nothing of React; the
// component hands it the latest props and the pointer.

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { type Device, isMeteredDevice } from '../../core/devices/Device'
import { normalizeParam, type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from './display-kit'
import { infoProps, infoText } from './info'
import {
  DisplayTaps,
  onDisplayFrame,
  type DisplayColours,
  type DisplayFrame,
  type DisplayHandle,
  type DisplaySignal,
  type DisplayView,
  type PlateDisplay,
} from './plate-display'
import { cx } from './tokens'

/** What the runner reads each time it draws; the component keeps it current. */
export interface DisplayInputs {
  display: PlateDisplay
  device: Device
  /** The node that feeds the device, for the level going in; null when unknown. */
  source: AudioNode | null
  width: number
  height: number
  powered: boolean
  params: Readonly<Record<string, ParamSpec>>
  values: Readonly<Record<string, number>>
}

/** How near a press must be to a handle to take it, in pixels: wider under a finger. */
const HIT_MOUSE = 9
const HIT_TOUCH = 18

// Every display that is mounted, for the once-a-second look at things frames
// do not tell: the theme's colours, the screen's pixel ratio, a tap a chain cut.
const mounted = new Set<DisplayRunner>()
let slowTimer: ReturnType<typeof setInterval> | null = null

function slowTick(): void {
  for (const runner of mounted) runner.look()
}

export class DisplayRunner {
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly observer: IntersectionObserver | null = null
  private visible = true
  private state: unknown
  private stop: (() => void) | null = null
  private unwatch: (() => void) | null = null
  private taps: DisplayTaps | null = null
  private tapsFor: { source: AudioNode | null; output: AudioNode } | null = null
  private colours: DisplayColours = PLAIN_COLOURS
  private fontFamily = 'sans-serif'
  private colourKey = ''
  private pixelRatio = 0
  private lastMs: number | null = null
  private drawnMs = Number.NEGATIVE_INFINITY
  private disposed = false
  hot: string | null = null
  dragging = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly inputs: () => DisplayInputs,
  ) {
    let ctx: CanvasRenderingContext2D | null = null
    try {
      ctx = canvas.getContext('2d')
    } catch {
      // No canvas here (a test's document): the display stays blank.
    }
    this.ctx = ctx
    this.state = inputs().display.init?.()
    if (ctx && typeof IntersectionObserver === 'function') {
      this.visible = false
      this.observer = new IntersectionObserver((entries) => {
        const seen = entries[entries.length - 1]?.isIntersecting ?? false
        if (seen === this.visible) return
        this.visible = seen
        this.sync()
      })
      this.observer.observe(canvas)
    }
    if (ctx) {
      mounted.add(this)
      slowTimer ??= setInterval(slowTick, 1000)
    }
  }

  /** After anything changed (a knob, the power, the size): run or stand still, and draw. */
  sync(): void {
    if (this.disposed || !this.ctx) return
    const { display, device, powered, source } = this.inputs()
    this.fit()
    const run = Boolean(display.live) && this.visible && powered
    if (run) {
      const live = display.live ?? {}
      if (live.meters && !this.unwatch && isMeteredDevice(device)) {
        this.unwatch = device.watchMeters()
      }
      if (live.signal || live.spectrum || live.stereo) {
        const output = device.output
        if (this.tapsFor?.source !== source || this.tapsFor?.output !== output) {
          this.taps?.release()
          this.taps = DisplayTaps.open(source, output, {
            spectrum: live.spectrum,
            stereo: live.stereo,
          })
          this.tapsFor = { source, output }
        }
      }
      if (!this.stop) {
        this.lastMs = null
        this.stop = onDisplayFrame((nowMs) => this.onFrame(nowMs))
      }
    } else {
      this.rest()
      this.readColours()
      this.draw(typeof performance === 'object' ? performance.now() : 0, 0, null)
    }
  }

  /** Once a second: colours a theme changed, a screen with another pixel ratio, a tap that was cut. */
  look(): void {
    if (this.disposed || !this.ctx || !this.visible) return
    this.taps?.mend()
    const before = this.colourKey
    this.readColours()
    const ratio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
    if (!this.stop && (before !== this.colourKey || ratio !== this.pixelRatio)) this.sync()
  }

  dispose(): void {
    this.disposed = true
    this.rest()
    this.observer?.disconnect()
    mounted.delete(this)
    if (mounted.size === 0 && slowTimer !== null) {
      clearInterval(slowTimer)
      slowTimer = null
    }
  }

  /** The handles where they stand now. */
  handles(): readonly DisplayHandle[] {
    const { display } = this.inputs()
    return display.handles ? display.handles(this.view()) : []
  }

  /** The handle a press at (x, y) takes, the nearest within reach; null for none. */
  hit(x: number, y: number, touch: boolean): DisplayHandle | null {
    const reach = touch ? HIT_TOUCH : HIT_MOUSE
    let found: DisplayHandle | null = null
    let nearest = reach * reach
    for (const handle of this.handles()) {
      const distance = (handle.x - x) ** 2 + (handle.y - y) ** 2
      if (distance <= nearest) {
        nearest = distance
        found = handle
      }
    }
    return found
  }

  /** Mark a handle as under the pointer or in hand, and show it at once on a still display. */
  point(hot: string | null, dragging: boolean): void {
    if (hot === this.hot && dragging === this.dragging) return
    this.hot = hot
    this.dragging = dragging
    if (!this.stop) this.sync()
  }

  private rest(): void {
    this.stop?.()
    this.stop = null
    this.unwatch?.()
    this.unwatch = null
    this.taps?.release()
    this.taps = null
    this.tapsFor = null
  }

  private view(): DisplayView {
    const { params, values, width, height } = this.inputs()
    return {
      width,
      height,
      at: (param) => {
        const spec = params[param]
        return spec ? normalizeParam(spec, values[param] ?? spec.default) : 0
      },
      value: (param) => {
        const spec = params[param]
        return spec ? (values[param] ?? spec.default) : 0
      },
      spec: (param) => params[param],
    }
  }

  /** The canvas holds as many pixels as the screen shows for its size. */
  private fit(): void {
    const { width, height } = this.inputs()
    const ratio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
    const w = Math.max(1, Math.round(width * ratio))
    const h = Math.max(1, Math.round(height * ratio))
    if (this.canvas.width !== w) this.canvas.width = w
    if (this.canvas.height !== h) this.canvas.height = h
    this.pixelRatio = ratio
  }

  private readColours(): void {
    if (typeof getComputedStyle !== 'function') return
    // The stylesheet puts the plate's three colours in three properties whose
    // computed value is a colour the canvas can paint, whatever they were written as.
    const style = getComputedStyle(this.canvas)
    const ink = style.color
    const accent = style.outlineColor
    const plate = style.textDecorationColor
    if (ink) this.colours = { ink, accent: accent || ink, plate: plate || PLAIN_COLOURS.plate }
    if (style.fontFamily) this.fontFamily = style.fontFamily
    this.colourKey = `${ink}|${accent}|${plate}|${style.fontFamily}`
  }

  private onFrame(nowMs: number): void {
    const { display } = this.inputs()
    const interval = 1000 / (display.live?.fps ?? 30)
    // Half a millisecond of slack so a 60 Hz frame passes a 16.67 ms interval.
    if (nowMs - this.drawnMs < interval - 0.5) return
    if (this.colourKey === '') this.readColours()
    const dt = this.lastMs === null ? 0 : Math.min(0.25, (nowMs - this.lastMs) / 1000)
    this.lastMs = nowMs
    this.draw(nowMs, dt, this.taps ? this.taps.read() : null)
  }

  private draw(nowMs: number, dt: number, signal: DisplaySignal | null): void {
    const ctx = this.ctx
    if (!ctx) return
    const { display, device, powered, width, height } = this.inputs()
    this.drawnMs = nowMs
    const metered = isMeteredDevice(device) ? device : null
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.globalAlpha = 1
    const frame: DisplayFrame = {
      ...this.view(),
      ctx,
      colours: this.colours,
      fontFamily: this.fontFamily,
      meter: (name) => (metered && name in metered.meters ? metered.meter(name) : 0),
      hasMeter: (name) => metered !== null && name in metered.meters,
      signal,
      now: nowMs / 1000,
      dt,
      powered,
      sampleRate: device.output.context?.sampleRate ?? 48000,
      hot: this.hot,
      dragging: this.dragging,
      state: this.state,
    }
    ctx.save()
    try {
      display.draw(frame)
    } finally {
      ctx.restore()
    }
  }
}

export interface PlateDisplayLayerProps extends DisplayInputs {
  /** The device's name, for the info view. */
  heading: string
  /** A drag on a handle begins: the parameters it will move. */
  onDragStart(names: readonly string[]): void
  /** The drag moved: the parameters' new values, in their own units. */
  onDrag(params: Readonly<Record<string, number>>): void
  onDragEnd(names: readonly string[]): void
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

interface Grab {
  pointerId: number
  key: string
  names: readonly string[]
  /** From the handle to the pointer, so the handle does not jump to the pointer when taken. */
  dx: number
  dy: number
}

/** A plate's display: a canvas, run while it is in view. */
export function PlateDisplayLayer(props: PlateDisplayLayerProps) {
  const { display, device, heading, width, height, className, style } = props
  const canvas = useRef<HTMLCanvasElement>(null)
  const latest = useRef(props)
  latest.current = props
  const runner = useRef<DisplayRunner | null>(null)
  const grab = useRef<Grab | null>(null)

  useEffect(() => {
    if (!canvas.current) return
    const made = new DisplayRunner(canvas.current, () => latest.current)
    runner.current = made
    return () => {
      runner.current = null
      made.dispose()
    }
  }, [display, device])

  // After every render: a knob moved, the power changed, the plate opened.
  useEffect(() => {
    runner.current?.sync()
  })

  // A turn of the wheel over a handle is the handle's, not the page's: that
  // takes a listener that may refuse the scroll, which React's are not.
  useEffect(() => {
    const element = canvas.current
    if (!element || !display.handles) return
    const onWheel = (event: WheelEvent): void => {
      const at = pointIn(element, event)
      const handle = runner.current?.hit(at.x, at.y, false)
      if (!handle?.wheel || event.deltaY === 0) return
      event.preventDefault()
      const params = handle.wheel(event.deltaY < 0 ? 1 : -1)
      const names = Object.keys(params)
      latest.current.onDragStart(names)
      latest.current.onDrag(params)
      latest.current.onDragEnd(names)
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [display, device])

  const interactive = display.handles !== undefined

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (event.button !== 0 || grab.current) return
    const at = pointIn(event.currentTarget, event)
    const handle = runner.current?.hit(at.x, at.y, event.pointerType !== 'mouse')
    if (!handle) {
      // A press beside the handles is a press on the plate: a chain carries it from there.
      delete event.currentTarget.dataset.lmHandle
      return
    }
    // A chain reads this before it decides to carry the plate, and leaves the press to the handle.
    event.currentTarget.dataset.lmHandle = handle.key
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const names = Object.keys(handle.drag(handle.x, handle.y))
    grab.current = {
      pointerId: event.pointerId,
      key: handle.key,
      names,
      dx: at.x - handle.x,
      dy: at.y - handle.y,
    }
    runner.current?.point(handle.key, true)
    props.onDragStart(names)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    const at = pointIn(event.currentTarget, event)
    const held = grab.current
    if (!held) {
      const handle = runner.current?.hit(at.x, at.y, event.pointerType !== 'mouse') ?? null
      if (handle) event.currentTarget.dataset.lmHandle = handle.key
      else delete event.currentTarget.dataset.lmHandle
      runner.current?.point(handle?.key ?? null, false)
      return
    }
    if (event.pointerId !== held.pointerId) return
    const handle = runner.current?.handles().find((candidate) => candidate.key === held.key)
    if (!handle) return
    props.onDrag(handle.drag(at.x - held.dx, at.y - held.dy))
  }

  const letGo = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    const held = grab.current
    if (held?.pointerId !== event.pointerId) return
    grab.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    runner.current?.point(held.key, false)
    props.onDragEnd(held.names)
  }

  return (
    <canvas
      ref={canvas}
      className={cx(
        'lm-plate__display',
        `lm-plate__display--${display.place}`,
        interactive && 'lm-plate__display--handles',
        className,
      )}
      style={{ width, height, ...style }}
      aria-hidden="true"
      data-lm-display={device.id}
      data-testid={props['data-testid']}
      {...infoProps(
        `${heading} display`,
        infoText(
          display.info,
          interactive
            ? 'Drag a point to set what it stands for, as its knob does. A double press puts it back.'
            : null,
        ),
      )}
      // A second press on a canvas would select the words beside it.
      onMouseDown={(event) => {
        if (event.detail > 1) event.preventDefault()
      }}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? letGo : undefined}
      onPointerCancel={interactive ? letGo : undefined}
      onPointerLeave={
        interactive
          ? (event) => {
              if (grab.current) return
              delete event.currentTarget.dataset.lmHandle
              runner.current?.point(null, false)
            }
          : undefined
      }
      onDoubleClick={
        interactive
          ? (event) => {
              const at = pointIn(event.currentTarget, event)
              const params = runner.current?.hit(at.x, at.y, false)?.reset?.()
              if (!params) return
              const names = Object.keys(params)
              props.onDragStart(names)
              props.onDrag(params)
              props.onDragEnd(names)
            }
          : undefined
      }
    />
  )
}

/** A pointer's place in the display's own pixels. */
function pointIn(
  element: HTMLElement,
  event: { clientX: number; clientY: number },
): { x: number; y: number } {
  const box = element.getBoundingClientRect()
  return { x: event.clientX - box.left, y: event.clientY - box.top }
}
