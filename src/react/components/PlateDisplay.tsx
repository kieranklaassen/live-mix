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
import { type FrameScheduler } from '../frame'
import { useFrameScheduler, useMaybeEngine } from '../hooks/useEngine'
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
  /** The frames it runs on, and the context its device lives in; the layer takes both from the provider. */
  frames?: FrameScheduler
  context?: BaseAudioContext | null
}

/** How near a press must be to a handle to take it, in pixels: wider under a finger. */
const HIT_MOUSE = 9
const HIT_TOUCH = 18
/** Handles this near to one another, in pixels, stand on one another: a press cannot tell them apart. */
const STACKED = 1.5
/** Turns of the wheel this close together, in milliseconds, are one gesture and one undo step. */
const WHEEL_REST_MS = 400
/** What a wheel sends for one notch, in pixels: a step of a handle's `wheel`. */
const WHEEL_NOTCH = 100

// Every display that is mounted, for the once-a-second look at things frames
// do not tell: the theme's colours, the screen's pixel ratio, a tap a chain cut.
const mounted = new Set<DisplayRunner>()
let slowTimer: ReturnType<typeof setInterval> | null = null

function slowTick(): void {
  for (const runner of mounted) runner.look()
}

/** A level under this, in and out, is silence: 80 dB under full scale. */
const QUIET = 1e-4
/** How long a display runs on in silence before it stands still, unless it says (`live.settle`). */
const SETTLE_SEC = 8
/** How often a display that stands still in silence listens for sound, in ms. */
const LISTEN_MS = 200

// Displays standing still in silence. They ask for no frames and no readings;
// a timer listens at their taps, and the first sound sets them running again.
const settled = new Set<DisplayRunner>()
let listenTimer: ReturnType<typeof setInterval> | null = null

function listenTick(): void {
  for (const runner of [...settled]) runner.listen()
}

function settle(runner: DisplayRunner): void {
  settled.add(runner)
  listenTimer ??= setInterval(listenTick, LISTEN_MS)
}

function unsettle(runner: DisplayRunner): void {
  if (!settled.delete(runner)) return
  if (settled.size === 0 && listenTimer !== null) {
    clearInterval(listenTimer)
    listenTimer = null
  }
}

/** How many displays stand still in silence now; for a test or a measurement. */
export function settledDisplays(): number {
  return settled.size
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
  /** How long there has been no sound at the device, in seconds, while it runs. */
  private quietSec = 0
  private drawnFrom:
    | (Pick<DisplayInputs, 'display' | 'device' | 'source' | 'width' | 'height' | 'powered'> & {
        visible: boolean
        values: Readonly<Record<string, number>>
      })
    | null = null
  private disposed = false
  /** The handle moved last, by key: it lies on top of one it stands on. */
  private top: string | null = null
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

  /**
   * After anything changed (a knob, the power, the size): run or stand still,
   * and draw. The layer calls it on every render; a display standing still in
   * silence stays so unless something it draws from did change, or `stir` says
   * to run (sound again, a point under the pointer, new colours).
   */
  sync(stir = false): void {
    if (this.disposed || !this.ctx) return
    const { display, device, powered, source, frames, context } = this.inputs()
    const changed = this.changed()
    const run = Boolean(display.live) && this.visible && powered
    if (run && settled.has(this) && !changed && !stir) return
    this.fit()
    if (run) {
      const live = display.live ?? {}
      // It runs again for a while, and stands still again if the silence goes on.
      unsettle(this)
      if (changed || stir) this.quietSec = 0
      if (live.meters && !this.unwatch && isMeteredDevice(device)) {
        this.unwatch = device.watchMeters()
      }
      // Every running display is tapped, whatever it reads: the taps say when
      // there is no sound, and then it need not run.
      const output = device.output
      if (this.tapsFor?.source !== source || this.tapsFor?.output !== output) {
        this.taps?.release()
        this.taps = DisplayTaps.open(
          source,
          output,
          { spectrum: live.spectrum, stereo: live.stereo },
          context,
        )
        this.tapsFor = { source, output }
      }
      if (!this.stop) {
        this.lastMs = null
        this.stop = onDisplayFrame((nowMs) => this.onFrame(nowMs), frames)
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
    if (!this.stop && (before !== this.colourKey || ratio !== this.pixelRatio)) this.sync(true)
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

  /**
   * The handle a press at (x, y) takes, the nearest within reach; null for
   * none. Where two stand on one another the one moved last lies on top, as
   * the last thing put down does: it can be taken off again, and what it
   * covered can be reached.
   */
  hit(x: number, y: number, touch: boolean): DisplayHandle | null {
    const reach = touch ? HIT_TOUCH : HIT_MOUSE
    let found: DisplayHandle | null = null
    let nearest = reach * reach
    let top: DisplayHandle | null = null
    let topDistance = 0
    for (const handle of this.handles()) {
      const distance = (handle.x - x) ** 2 + (handle.y - y) ** 2
      if (distance > reach * reach) continue
      if (handle.key === this.top) {
        top = handle
        topDistance = distance
      }
      if (distance <= nearest) {
        nearest = distance
        found = handle
      }
    }
    return top && Math.sqrt(topDistance) <= Math.sqrt(nearest) + STACKED ? top : found
  }

  /** A handle was moved: it lies over any it comes to stand on. */
  moved(key: string): void {
    this.top = key
  }

  /** Mark a handle as under the pointer or in hand, and show it at once on a still display. */
  point(hot: string | null, dragging: boolean): void {
    if (hot === this.hot && dragging === this.dragging) return
    this.hot = hot
    this.dragging = dragging
    if (!this.stop) this.sync(true)
  }

  /** In silence: sound again sets it running. */
  listen(): void {
    if (this.disposed || !settled.has(this)) return
    if (this.taps?.heard(QUIET)) this.sync(true)
  }

  /** Whether what it draws from is other than at the last call: the settings, the size, the device, the power. */
  private changed(): boolean {
    const { display, device, source, width, height, powered, values } = this.inputs()
    const before = this.drawnFrom
    const same =
      before !== null &&
      before.display === display &&
      before.device === device &&
      before.source === source &&
      before.width === width &&
      before.height === height &&
      before.powered === powered &&
      before.visible === this.visible &&
      display.params.every((name) => before.values[name] === values[name])
    if (!same) {
      // A copy of what it reads: the settings may be one object that changes in place.
      const read: Record<string, number> = {}
      for (const name of display.params) read[name] = values[name]
      this.drawnFrom = {
        display,
        device,
        source,
        width,
        height,
        powered,
        visible: this.visible,
        values: read,
      }
    }
    return !same
  }

  private rest(): void {
    unsettle(this)
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
    const live = display.live ?? {}
    const reads = live.signal === true || live.spectrum === true || live.stereo === true
    const signal = this.taps && reads ? this.taps.read() : null
    this.draw(nowMs, dt, signal)
    // Without taps nothing says there is silence, and it runs on.
    const heard = signal
      ? signal.output.peak > QUIET || (signal.input?.peak ?? 0) > QUIET
      : (this.taps?.heard(QUIET) ?? true)
    this.quietSec = heard ? 0 : this.quietSec + dt
    if (this.quietSec >= (live.settle ?? SETTLE_SEC)) this.settle()
  }

  /**
   * Nothing has sounded for a while: what was drawn stays, and the display
   * asks for no more frames and no more readings until there is sound again
   * or something of its own changes. The taps stay, to listen with.
   */
  private settle(): void {
    this.stop?.()
    this.stop = null
    this.unwatch?.()
    this.unwatch = null
    settle(this)
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
      sampleRate:
        (device.output.context as BaseAudioContext | undefined)?.sampleRate ??
        this.inputs().context?.sampleRate ??
        48000,
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

export interface PlateDisplayLayerProps extends Omit<DisplayInputs, 'frames' | 'context'> {
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
  const frames = useFrameScheduler()
  const context = useMaybeEngine()?.context ?? null
  const latest = useRef({ ...props, frames, context })
  latest.current = { ...props, frames, context }
  const runner = useRef<DisplayRunner | null>(null)
  const grab = useRef<Grab | null>(null)
  /** Ends a turn of the wheel that is still open, before the hand takes a handle. */
  const wheelRest = useRef<(() => void) | null>(null)

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
  // Notches that follow one another are one turn of the wheel, and one undo
  // step: the turn is over when the wheel has rested, or the hand does
  // something else.
  useEffect(() => {
    const element = canvas.current
    if (!element || !display.handles) return
    let turning: {
      key: string
      /** The parameters the turn moves, once it has moved any. */
      names: readonly string[] | null
      /** How far the wheel has gone since the last step it made, in pixels: up is positive. */
      pixels: number
      timer?: ReturnType<typeof setTimeout>
    } | null = null
    const rest = (): void => {
      if (!turning) return
      clearTimeout(turning.timer)
      const { names } = turning
      turning = null
      if (names) latest.current.onDragEnd(names)
    }
    wheelRest.current = rest
    const onWheel = (event: WheelEvent): void => {
      // A swipe that goes more across than up or down is the chain's, to scroll by.
      if (event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const at = pointIn(element, event)
      const handle = runner.current?.hit(at.x, at.y, false)
      if (!handle?.wheel) return
      event.preventDefault()
      if (turning && turning.key !== handle.key) rest()
      const turn = turning ?? { key: handle.key, names: null, pixels: 0 }
      turning = turn
      clearTimeout(turn.timer)
      turn.timer = setTimeout(rest, WHEEL_REST_MS)
      // A step for every notch of a wheel, and as far for a trackpad's many
      // small events as for the one notch they add up to.
      turn.pixels += wheelPixels(event)
      const steps = Math.trunc(turn.pixels / WHEEL_NOTCH)
      if (steps === 0) return
      turn.pixels -= steps * WHEEL_NOTCH
      const params = handle.wheel(steps)
      if (!turn.names) {
        turn.names = Object.keys(params)
        latest.current.onDragStart(turn.names)
      }
      latest.current.onDrag(params)
    }
    // A finger's press is given to the nearest thing that answers a press, and
    // the knob beside a display is one: a canvas that answers presses itself
    // keeps the ones that land on it, also at its edge.
    const onClick = (): void => {}
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('click', onClick)
    return () => {
      rest()
      wheelRest.current = null
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('click', onClick)
    }
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
    wheelRest.current?.()
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
    runner.current?.moved(held.key)
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
              wheelRest.current?.()
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

/** How far one event turns the wheel, in pixels, up being positive: lines and pages are scaled so a notch of three lines is a notch. */
function wheelPixels(event: Pick<WheelEvent, 'deltaY' | 'deltaMode'>): number {
  const scale = event.deltaMode === 1 ? WHEEL_NOTCH / 3 : event.deltaMode === 2 ? WHEEL_NOTCH : 1
  return -event.deltaY * scale
}

/** A pointer's place in the display's own pixels. */
function pointIn(
  element: HTMLElement,
  event: { clientX: number; clientY: number },
): { x: number; y: number } {
  const box = element.getBoundingClientRect()
  return { x: event.clientX - box.left, y: event.clientY - box.top }
}
