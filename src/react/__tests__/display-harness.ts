// What a test of a plate display needs: a canvas context that draws nothing
// and writes down every call, and a frame made from a device's parameter
// table, so a display is drawn at any setting without a browser.

import { type DeviceMeterSpec } from '../../core/devices/Device'
import { devices as nodeDevices } from '../../core/devices'
import { type DeviceDescriptor } from '../../core/devices/registry'
import { normalizeParam, type ParamSpec } from '../../core/params'
import { STOCK_WASM_DEVICES } from '../../dsp'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  DISPLAY_STRIP_HEIGHT,
  DISPLAY_STRIP_WIDTH,
  DISPLAY_WINDOW_HEIGHT,
  displayWindowWidth,
  type DisplayFrame,
  type DisplayLevel,
  type DisplaySignal,
  type DisplayView,
  type PlateDisplay,
} from '../components/plate-display'

export interface DrawCall {
  name: string
  args: readonly unknown[]
}

/** The calls that put ink on the canvas. */
const MARKS = new Set(['stroke', 'fill', 'fillRect', 'strokeRect', 'fillText', 'strokeText'])

export interface RecordingContext {
  ctx: CanvasRenderingContext2D
  /** Every method called, in order. */
  calls: DrawCall[]
  /** How many of them put ink down. */
  marks(): number
  /** Every number handed to the canvas, with the call it was handed to. */
  numbers(): { name: string; value: number }[]
  /** The words written, in order. */
  words(): string[]
  /** One line that changes when what was drawn changes. */
  print(): string
}

/** A 2D context for a test: it paints nothing, answers what a display asks, and keeps what it was told. */
export function recordingContext(): RecordingContext {
  const calls: DrawCall[] = []
  const props: Record<string, unknown> = {
    globalAlpha: 1,
    lineWidth: 1,
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineCap: 'butt',
    lineJoin: 'miter',
    lineDashOffset: 0,
    globalCompositeOperation: 'source-over',
  }
  const gradient = { addColorStop: () => undefined }
  const answers: Record<string, (...args: unknown[]) => unknown> = {
    measureText: (words) => ({ width: String(words).length * 5 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    getLineDash: () => [],
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    isPointInPath: () => false,
  }
  const ctx = new Proxy(props, {
    get(target, key) {
      if (typeof key !== 'string') return undefined
      if (key in target) return target[key]
      return (...args: unknown[]) => {
        calls.push({ name: key, args })
        return answers[key]?.(...args)
      }
    },
    set(target, key, value) {
      if (typeof key === 'string') {
        target[key] = value
        calls.push({ name: `set ${key}`, args: [value] })
      }
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  const numbers = (): { name: string; value: number }[] =>
    calls.flatMap((call) =>
      call.args
        .flatMap((arg) => (Array.isArray(arg) ? (arg as unknown[]) : [arg]))
        .filter((arg): arg is number => typeof arg === 'number')
        .map((value) => ({ name: call.name, value })),
    )
  return {
    ctx,
    calls,
    marks: () => calls.filter((call) => MARKS.has(call.name)).length,
    numbers,
    words: () =>
      calls.filter((call) => call.name === 'fillText').map((call) => String(call.args[0])),
    print: () =>
      calls
        .map(
          (call) =>
            `${call.name}(${call.args.map((arg) => (typeof arg === 'number' ? arg.toFixed(2) : String(arg))).join(',')})`,
        )
        .join(';'),
  }
}

/** Every stock device's descriptor by id: the Web Audio ones and the compiled ones. */
export function stockDescriptors(): Map<string, DeviceDescriptor> {
  const all = new Map<string, DeviceDescriptor>()
  for (const descriptor of nodeDevices.list()) all.set(descriptor.id, descriptor)
  for (const descriptor of STOCK_WASM_DEVICES) all.set(descriptor.id, descriptor)
  return all
}

/** A level as the taps report it: a sine of that peak, so the wave is there to read too. */
export function testLevel(peak: number, cycles = 8): DisplayLevel {
  const wave = new Float32Array(2048)
  for (let i = 0; i < wave.length; i++)
    wave[i] = peak * Math.sin((i / wave.length) * cycles * 2 * Math.PI)
  return { peak, rms: peak / Math.SQRT2, wave }
}

/** The sound at a device for a test: so loud going in and coming out, with a spectrum that falls with frequency. */
export function testSignal(input = 0.5, output = 0.35): DisplaySignal {
  const spectrum = new Float32Array(1024)
  for (let i = 0; i < spectrum.length; i++)
    spectrum[i] = -20 - 60 * (i / spectrum.length) + (i % 7 === 0 ? 8 : 0)
  return {
    input: testLevel(input),
    output: testLevel(output),
    spectrum,
    binHz: 48000 / 2048,
    left: testLevel(output, 8),
    right: testLevel(output * 0.8, 9),
  }
}

/** The size a display is given on a plate at rest. */
export function displaySize(display: PlateDisplay): { width: number; height: number } {
  return display.place === 'strip'
    ? { width: DISPLAY_STRIP_WIDTH, height: DISPLAY_STRIP_HEIGHT }
    : { width: displayWindowWidth(display.columns ?? 2), height: DISPLAY_WINDOW_HEIGHT }
}

export interface FrameOptions {
  /** Parameters away from their defaults, in their own units. */
  values?: Readonly<Record<string, number>>
  /** The device's readings by name; a name left out is a reading the device does not have. */
  meters?: Readonly<Record<string, number>>
  signal?: DisplaySignal | null
  width?: number
  height?: number
  now?: number
  dt?: number
  powered?: boolean
  hot?: string | null
  dragging?: boolean
  /** The display's own state from an earlier frame; left out, `init` makes it. */
  state?: unknown
}

/** What a display reads without a canvas, from a parameter table. */
export function viewOf(
  display: PlateDisplay,
  params: Readonly<Record<string, ParamSpec>>,
  options: FrameOptions = {},
): DisplayView {
  const size = displaySize(display)
  const values = options.values ?? {}
  return {
    width: options.width ?? size.width,
    height: options.height ?? size.height,
    at: (name) => {
      const spec = params[name]
      return spec ? normalizeParam(spec, values[name] ?? spec.default) : 0
    },
    value: (name) => {
      const spec = params[name]
      return spec ? (values[name] ?? spec.default) : 0
    },
    spec: (name) => params[name],
  }
}

/** A frame for `display.draw` and the context that kept what it drew. */
export function frameOf(
  display: PlateDisplay,
  params: Readonly<Record<string, ParamSpec>>,
  options: FrameOptions = {},
): { frame: DisplayFrame; drawn: RecordingContext } {
  const drawn = recordingContext()
  const meters = options.meters ?? {}
  const frame: DisplayFrame = {
    ...viewOf(display, params, options),
    ctx: drawn.ctx,
    colours: PLAIN_COLOURS,
    fontFamily: 'sans-serif',
    meter: (name) => meters[name] ?? 0,
    hasMeter: (name) => name in meters,
    signal: options.signal ?? null,
    now: options.now ?? 10,
    dt: options.dt ?? 0,
    powered: options.powered ?? true,
    sampleRate: 48000,
    hot: options.hot ?? null,
    dragging: options.dragging ?? false,
    state: 'state' in options ? options.state : display.init?.(),
  }
  return { frame, drawn }
}

/** Draw one frame and hand back what was drawn. */
export function drawDisplay(
  display: PlateDisplay,
  params: Readonly<Record<string, ParamSpec>>,
  options: FrameOptions = {},
): RecordingContext {
  const { frame, drawn } = frameOf(display, params, options)
  display.draw(frame)
  return drawn
}

/**
 * Run a display as the plate does for `seconds`: frame after frame on one
 * state, with the same signal and readings throughout unless `each` gives
 * others for a frame. The last frame's drawing comes back.
 */
export function runDisplay(
  display: PlateDisplay,
  params: Readonly<Record<string, ParamSpec>>,
  seconds: number,
  options: FrameOptions = {},
  each?: (time: number) => Partial<FrameOptions>,
): RecordingContext {
  const fps = display.live?.fps ?? 30
  const state: unknown = 'state' in options ? options.state : display.init?.()
  const start = options.now ?? 10
  let last = recordingContext()
  const frames = Math.max(1, Math.round(seconds * fps))
  for (let n = 0; n < frames; n++) {
    const time = start + n / fps
    last = drawDisplay(display, params, {
      ...options,
      ...each?.(time - start),
      state,
      now: time,
      dt: n === 0 ? 0 : 1 / fps,
    })
  }
  return last
}

/** A reading for each meter a device declares: 0 for all of them unless given. */
export function metersOf(
  specs: Readonly<Record<string, DeviceMeterSpec>> | undefined,
  value = 0,
): Record<string, number> {
  return Object.fromEntries(Object.keys(specs ?? {}).map((name) => [name, value]))
}
